# -*- coding: utf-8 -*-
#
# Copyright 2018 Exabeam, Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import sqlite3
import sys
import json
import pandas as pd
import urlparse
import matplotlib.pyplot as plt
from wordcloud import WordCloud, STOPWORDS, ImageColorGenerator
import os
import random
import logging
from Cryptodome.Cipher import AES
from Cryptodome.Protocol.KDF import PBKDF2
import keyring
import re
import cStringIO
import base64
import requests
import leveldb
import time

logger = logging.getLogger()
handler = logging.StreamHandler()
formatter = logging.Formatter('%(asctime)s %(name)-12s %(levelname)-8s %(message)s')
handler.setFormatter(formatter)
logger.addHandler(handler)
logger.setLevel(logging.DEBUG)


# Number of microseconds between Webkit and Unix epochs
WEBKIT_EPOCH_OFFSET = 11644473600000000
IP_V4_REGEX = "(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)"


class Synopsis():
    def __init__(self, profile_path):
        self.profile_path = profile_path
        self.cached_key = None

    @staticmethod
    def extract_domain(input_url):
        parsed = urlparse.urlparse(input_url)
        return parsed.netloc

    @staticmethod
    def extract_q(input_url):
        if 'google.' and '/url?' in input_url:
            return False

        parsed_qs = urlparse.parse_qs(urlparse.urlparse(input_url).query)
        for key, value in parsed_qs.iteritems():
            if key == 'q':
                if isinstance(value, list) and len(value) == 1:
                    return value[0]
                else:
                    return value
        return False

    def decrypt_chrome_cookie(self, df_row):
        """Decryption based on work by Nathan Henrie and Jordan Wright as well as Chromium source:
         - Mac/Linux: http://n8henrie.com/2014/05/decrypt-chrome-cookies-with-python/
         - Windows: https://gist.github.com/jordan-wright/5770442#file-chrome_extract-py
         - Relevant Chromium source code: http://src.chromium.org/viewvc/chrome/trunk/src/components/os_crypt/
         """
        salt = b'saltysalt'
        iv = b' ' * 16
        length = 16

        def chrome_decrypt(encrypted, key=None):
            # Encrypted cookies should be prefixed with 'v10' according to the
            # Chromium code. Strip it off.
            encrypted = encrypted[3:]

            # Strip padding by taking off number indicated by padding
            # eg if last is '\x0e' then ord('\x0e') == 14, so take off 14.
            def clean(x):
                return x[:-ord(x[-1])]

            cipher = AES.new(key, AES.MODE_CBC, IV=iv)
            decrypted = cipher.decrypt(encrypted)

            return clean(decrypted)

        decrypted_value = "<error>"
        if df_row['encrypted_value'] is not None:
            if len(df_row['encrypted_value']) >= 2:

                # If running Chrome on OSX
                if sys.platform == 'darwin':
                        try:
                            if not self.cached_key:
                                my_pass = keyring.get_password('Chrome Safe Storage', 'Chrome')
                                my_pass = my_pass.encode('utf8')
                                iterations = 1003
                                self.cached_key = PBKDF2(my_pass, salt, length, iterations)
                            decrypted_value = chrome_decrypt(df_row['encrypted_value'], key=self.cached_key)
                        except Exception as e:
                            logging.WARNING("Failed to decrypt cookie: {}".format(e))

                elif sys.platform == 'linux':
                    # If running Chromium on Linux.
                    # Unlike Win/Mac, we can decrypt Linux cookies without the user's pw
                    if decrypted_value is "<encrypted>":
                        try:
                            if not self.cached_key:
                                my_pass = 'peanuts'.encode('utf8')
                                iterations = 1
                                self.cached_key = PBKDF2(my_pass, salt, length, iterations)
                            decrypted_value = chrome_decrypt(df_row['encrypted_value'], key=self.cached_key)
                        except Exception as e:
                            logging.WARNING("Failed to decrypt cookie: {}".format(e))
                else:
                    decrypted_value = "<encrypted>"

        else:
            decrypted_value = df_row['value']

        return decrypted_value

    @staticmethod
    def load_autofill_data_frame(sqlite_file, browser_type="Chrome"):
        chrome_autofill_query = '''SELECT autofill.name, autofill.value, autofill.count FROM autofill'''

        if browser_type is "Chrome":
            web_data_db = sqlite3.connect(sqlite_file)
            data_frame = pd.read_sql_query(chrome_autofill_query, web_data_db)
            data_frame['value'] = data_frame['value'].str.encode('utf-8', errors='replace')

        else:
            raise TypeError("Unsupported browser type.")

        return data_frame

    @staticmethod
    def create_word_cloud_b64(word_list):
        random.shuffle(word_list)
        words = " ".join(word_list)

        stopwords = STOPWORDS.copy()
        stopwords.add("http")
        stopwords.add("https")
        stopwords.add("localstorage")
        stopwords.add("com_0")
        stopwords.add("new")
        stopwords.add("http_www")
        stopwords.add("sourceid")

        try:
            wordcloud = WordCloud(
                stopwords=stopwords,
                max_words=150,
                background_color="white",
                height=700,
                width=1200,
                margin=0,
                regexp=r"\w[\w'@\.]+"
            ).generate(words)

            plt.axis("off")
            plt.imshow(wordcloud)  # this must be here, or the wc image is blank
            wordcloud_bytes = cStringIO.StringIO()
            plt.savefig(wordcloud_bytes, bbox_inches='tight', format='jpg')
            wordcloud_bytes.seek(0)
            wordcloud_b64 = base64.b64encode(wordcloud_bytes.read())
            return wordcloud_b64

        except Exception as e:
            logging.error("Problem making word cloud: {}".format(e))

        return False

    @staticmethod
    def load_visits_data_frame(sqlite_file, browser_type="Chrome"):
        """Load visits data from a browser history file into a pandas data frame. Perform some optimizations to aid next steps."""

        chrome_visits_sql_query = '''SELECT urls.id, urls.url, urls.title, visits.visit_time
                                  FROM urls JOIN visits ON urls.id = visits.url LEFT JOIN visit_source ON visits.id = visit_source.id'''
        visits_db = sqlite3.connect(sqlite_file)

        if browser_type is "Chrome":
            data_frame = pd.read_sql_query(chrome_visits_sql_query, visits_db)

            # This should work for Webkit, but breaks because pandas' minimum allowed timestamp > 1601.
            # data_frame['visit_time'] = pd.to_datetime((data_frame['visit_time']), unit='us', origin=pd.Timestamp('1601-01-01'))

            # So instead subtract time from the Webkit epoch to move it to the unix epoch
            data_frame['visit_time'] = pd.to_datetime((data_frame['visit_time'] - WEBKIT_EPOCH_OFFSET), unit='us', origin='unix')

            # Make the data frame have a time-based index, which lets us do resampling (bucketing)
            data_frame.index = data_frame['visit_time']

        else:
            raise TypeError("Unsupported visits file.")

        # Apply the "extract_domain()" function on each value in the 'url' column, saving it in the new 'domain' column
        data_frame['domain'] = data_frame['url'].apply(Synopsis.extract_domain)

        return data_frame

    def extract_searches_from_visits_data_frame(self, input_data_frame, domains=None):
        """Return a new data frame with the specified refinements applied (filtering by domain and/or bucketing counts)"""

        # Make sure we have a pandas DataFrame as input
        assert isinstance(input_data_frame, pd.DataFrame)

        data_frame = input_data_frame[['domain', 'url', 'visit_time']]

        if domains:
            data_frame = data_frame[data_frame['domain'].isin(domains)]

        data_frame['query_terms'] = data_frame['url'].apply(self.extract_q)

        queries_data_frame = data_frame[data_frame['query_terms'] != False]
        return queries_data_frame

    @staticmethod
    def refine_visits_data_frame(input_data_frame, domain=None, resample=None):
        """Return a new data frame with the specified refinements applied (filtering by domain and/or bucketing counts)
            Pandas resample docs: http://pandas.pydata.org/pandas-docs/stable/timeseries.html#up-and-downsampling
        """

        # Make sure we have a pandas DataFrame as input
        assert isinstance(input_data_frame, pd.DataFrame)

        data_frame = input_data_frame[['domain', 'url', 'visit_time']]

        if domain:
            data_frame = data_frame[data_frame['domain'].str.contains(domain)]

        if resample == 'DoW':

            day_names = ['Mon', 'Tues', 'Wed', 'Thur', 'Fri', 'Sat', 'Sun']
            data_frame['day_of_week'] = data_frame['visit_time'].dt.dayofweek
            days = {0: 'Mon', 1: 'Tues', 2: 'Wed', 3: 'Thur', 4: 'Fri', 5: 'Sat', 6: 'Sun'}
            data_frame['day_of_week'] = data_frame['day_of_week'].apply(lambda x: days[x])
            data_frame['day_of_week'] = data_frame['day_of_week'].astype('category', categories=day_names, ordered=True)
            data_frame = data_frame.groupby([data_frame['visit_time'].dt.hour, 'day_of_week'])['domain'].count().unstack()

        elif resample:
            data_frame = data_frame.resample(resample).count()

        return data_frame

    def create_search_word_cloud(self, search_df):
        searches = search_df['query_terms']
        word_list = []
        for _, value in searches.iteritems():
            word_list.append(value)

        return self.create_word_cloud_b64(word_list)

    def create_autofill_word_cloud(self, autofill_df):
        word_list = []
        for _, row in autofill_df.iterrows():
            for _ in range(int(row['count'])):
                word_list.append(row['value'])

        return self.create_word_cloud_b64(word_list)

    @staticmethod
    def extract_accounts_from_visits(df):

        accounts = []

        # Facebook Account Display Name
        #   Select the title column of the df,
        #     then only the rows where the row's url matches the criteria,
        #     then take the unique values.

        facebook_display_names = df['title'][
            df["url"] == "https://www.facebook.com/?ref=tn_tnmn"] \
            .unique()

        for name in facebook_display_names:
            if "Log In" not in name:
                accounts.append({
                    'domain': 'facebook.com',
                    'account': name
                })

        # Gmail Account Address
        #   Select the title column of the df,
        #     then only the rows where the row's url
        #     and title match the criteria,
        #     then extract the account name from the title using the given regex (not expanding to a df),
        #     then take the unique values.
        gmail_account_addresses = df['title'][(
                                                  df["url"].str.contains("mail.google.com")) &
                                              df["title"].str.contains(r" - Gmail")] \
            .str.extract(".* - (.*) - Gmail", expand=False) \
            .unique()

        for gmail in gmail_account_addresses:
            accounts.append({
                'domain': 'gmail.com',
                'account': gmail
            })

        return accounts

    @staticmethod
    def extract_accounts_from_logins(sqlite_file, browser_type="Chrome"):
        chrome_logins_query = '''SELECT origin_url, action_url, username_element, username_value, password_element,
                            password_value, date_created, blacklisted_by_user, times_used FROM logins'''
        logins_db = sqlite3.connect(sqlite_file)

        extraced_accounts = []

        if browser_type is "Chrome":
            df = pd.read_sql_query(chrome_logins_query, logins_db)
            accounts = df[df['username_value'] != ""][['origin_url', 'username_value']]

            for _, row in accounts.iterrows():
                extraced_accounts.append({
                    'domain': urlparse.urlparse(row['origin_url']).netloc,
                    'account': row['username_value']
                })

        else:
            raise TypeError("Unsupported visits file.")

        return extraced_accounts

    @staticmethod
    def extract_geolocation_from_local_storage(local_storage, browser_type="Chrome"):
        logging.info("Extracting Geolocation Indicators from LocalStorage")

        found_geos = []

        for item in local_storage:
            # optimizely localStorage structure, common across origins
            if item['key'].endswith('$$visitor_profile'):
                opt = json.loads(item['value'])
                opt_ip = opt['profile'].get('IP')
                if opt_ip:
                    found_geos.append({
                        "type": "ip",
                        "geo": opt_ip,
                        "timestamp": pd.to_datetime(opt['profile'].get('currentTimestamp', 0), unit='ms', origin='unix')
                    })

        return found_geos

    def extract_geolocation_from_cookies(self, sqlite_file, browser_type="Chrome"):
        logging.info("Extracting Geolocation Indicators from Cookies")
        logging.info("Cookies from {}:".format(sqlite_file))

        found_geos = []

        geolocation_extractors = [
            {
                "site": ".*",
                "name": "OAGEO6d3d2",
                "geo_type": "dma",
                "regex": "%7C(?P<dma>\d{3})$"
            },
            {
                "site": ".*",
                "name": "ldsuid",
                "geo_type": "ip",
                "regex": "^(?P<ip>{})\.".format(IP_V4_REGEX)
            },
            {
                "site": "\.alibaba\.com",
                "name": "ali_ab",
                "geo_type": "ip",
                "regex": "^(?P<ip>{})\.".format(IP_V4_REGEX)
            },
            {
                "site": "\.alibaba\.com",
                "name": "ali_apache_id",
                "geo_type": "ip",
                "regex": "^(?P<ip>{})\.".format(IP_V4_REGEX)
            },
            {
                "site": "\.walmart\.com",
                "name": "location-data",
                "geo_type": "zip",
                "regex": "^(?P<zip>\d{5})"
            },
            {
                "site": "\.americanexpress\.com",
                "name": "SaneID",
                "geo_type": "ip",
                "regex": "^(?P<ip>{})-".format(IP_V4_REGEX)
            },
            {
                "site": "\.zoom\.us",
                "name": "_zm_iplang",
                "geo_type": "ip",
                "regex": "(?P<ip>{})$".format(IP_V4_REGEX)
            },
            {
                "site": "\.wikipedia\.org",
                "name": "GeoIP",
                "geo_type": "latlong",
                "regex": ":(?P<latlong>(-?\d{1,3}\.\d\d:){2})"
            },
            {
                "site": "\.data\.disqus\.com",
                "name": "ubvs",
                "geo_type": "ip",
                "regex": "^(?P<ip>{})1\d{{15}}$".format(IP_V4_REGEX)
            },
            {
                "site": "\.disqus\.com",
                "name": "ubvt",
                "geo_type": "ip",
                "regex": "^(?P<ip>{})1\d{{15}}$".format(IP_V4_REGEX)
            },
            {
                "site": "\.exosrv\.com",
                "name": "tag",
                "geo_type": "ip",
                "regex": "^v\d%7C(?P<ip>{})%7C.*".format(IP_V4_REGEX)
            },            {
                "site": "\.exoclick\.com",
                "name": "tag",
                "geo_type": "ip",
                "regex": "^v\d%7C(?P<ip>{})%7C.*".format(IP_V4_REGEX)
            },
            {
                "site": "\.cambridge\.org",
                "name": "localeChecker",
                "geo_type": "ip",
                "regex": "^.*__(?P<ip>{})__.*".format(IP_V4_REGEX)
            },
            {
                "site": "\.ebates\.com",
                "name": "cookie_id",
                "geo_type": "ip",
                "regex": "^(?P<ip>{})20.*$".format(IP_V4_REGEX)
            },
            {
                "site": ".*",
                "name": "OUTFOX_SEARCH_USER_ID",
                "geo_type": "ip",
                "regex": ".*@(?P<ip>{})$".format(IP_V4_REGEX)
            },
            {
                "site": "primosearch\.com",
                "name": "UID",
                "geo_type": "ip",
                "regex": ".*&(?P<ip>{})$".format(IP_V4_REGEX)
            },
            {
                "site": "rozetka\.com\.ua",
                "name": "D_SID",
                "geo_type": "ip",
                "regex": "^(?P<ip>{}):".format(IP_V4_REGEX)
            },
        ]

        chrome_cookies_sql_query = '''SELECT cookies.host_key, cookies.path, cookies.name, cookies.value, cookies.creation_utc,
                                cookies.last_access_utc, cookies.expires_utc, cookies.secure, cookies.httponly,
                                cookies.persistent, cookies.has_expires, cookies.priority, cookies.encrypted_value
                            FROM cookies'''
        old_chrome_cookies_sql_query = '''SELECT cookies.host_key, cookies.path, cookies.name, cookies.value, cookies.creation_utc,
                                    cookies.last_access_utc, cookies.expires_utc, cookies.secure, cookies.httponly,
                                    cookies.persistent, cookies.has_expires, cookies.priority
                                FROM cookies'''
        cookies_db = sqlite3.connect(sqlite_file)

        if browser_type is "Chrome":
            try:
                df = pd.read_sql_query(chrome_cookies_sql_query, cookies_db)
                df['value'] = df.apply(self.decrypt_chrome_cookie, axis=1)

            except:
                # Maybe it's a real old version of Chrome (pre-v33)
                df = pd.read_sql_query(old_chrome_cookies_sql_query, cookies_db)

            # Subtract time from the Webkit epoch to move it to the unix epoch
            df['last_access_utc'] = pd.to_datetime((df['last_access_utc'] - WEBKIT_EPOCH_OFFSET), unit='us', origin='unix')

            # Make the data frame have a time-based index, which lets us do resampling (bucketing)
            df.index = df['last_access_utc']
            for geo in geolocation_extractors:
                for _, row in df.iterrows():
                    if re.search(geo["site"], row['host_key'], flags=re.IGNORECASE):
                        if row['name'] == geo["name"]:
                            m = re.search(geo["regex"], row["value"])
                            if m:
                                found_geos.append({
                                    "type": geo["geo_type"],
                                    "geo": m.group(geo["geo_type"]),
                                    "timestamp": row["last_access_utc"]
                                })
        return found_geos

    @staticmethod
    def extract_user_info_from_preferences(preference_file, browser_type="Chrome"):
        with open(preference_file, 'rb') as pref_file:
            prefs = json.load(pref_file)

        extracted_prefs = []

        if prefs.get("account_info"):
            for account in prefs['account_info']:
                if account.get('full_name'):
                    extracted_prefs.append({'setting': 'Full Name', 'value': account['full_name']})

                if account.get('email'):
                    extracted_prefs.append({'setting': 'Email Address', 'value': account['email']})

                if account.get('picture_url'):
                    extracted_prefs.append({'setting': 'Account Picture', 'value': account['picture_url']})

        return extracted_prefs

    @staticmethod
    def get_geolocation(ip):
        geo = requests.get('http://ip-api.com/json/{}'.format(ip))
        ip_json = json.loads(geo.content)
        return ip_json['lat'], ip_json['lon']

    def plot_geos(self, geos):
        geo_df = pd.DataFrame()
        for geo in geos:
            if geo['type'] is 'ip':
                lat, lon = self.get_geolocation(geo['geo'])
                geo_df = geo_df.append({
                    'lat': lat,
                    'lon': lon,
                    'timestamp': geo['timestamp'],
                    'type': geo['type']
                }, ignore_index=True)
            elif geo['type'] is 'latlong':
                geo['geo'] = re.sub(':', ';', geo['geo'])
                if geo['geo'][-1] is ';':
                    geo['geo'] = geo['geo'][:-1]
                geo_df = geo_df.append({
                    'lat': float(geo['geo'].split(';')[0]),
                    'lon': float(geo['geo'].split(';')[1]),
                    'timestamp': geo['timestamp'],
                    'type': geo['type']
                }, ignore_index=True)
            else:
                print("Unsupported geo type: {}".format(geo['type']))
        return geo_df

    def make_accounts_table(self, visits_df=None, logins_sqlite_file=None, browser_type="Chrome"):
        accounts = []
        if visits_df is not None:
            visits_accounts = self.extract_accounts_from_visits(visits_df)
            if visits_accounts:
                accounts.extend(visits_accounts)

        if logins_sqlite_file:
            logins_accounts = syn.extract_accounts_from_logins(logins_sqlite_file)
            if logins_accounts:
                accounts.extend(logins_accounts)

        return accounts

    def load_local_storage(self, local_storage_directory, browser_type="Chrome"):
        local_storage = []
        if browser_type is "Chrome":
            try:
                db = leveldb.LevelDB(local_storage_directory, create_if_missing=False)
                pairs = list(db.RangeIter())
                for pair in pairs:
                    (key, value) = pair
                    ls_entry = syn.parse_local_storage_ldb_pairs(key, value)
                    if ls_entry:
                        local_storage.append(ls_entry)
            except:
                logger.warning("No levelDB localStorage directory found; skipping")

            return local_storage

        else:
            raise TypeError("Unsupported browser type.")

    @staticmethod
    def parse_local_storage_ldb_pairs(key, value):
        origin, ls_key, ls_value = (None, None, None)

        if key.startswith('META:'):
            return False

        elif key == 'VERSION':
            return False

        else:
            try:
                origin, ls_key = key.split('\x00', 1)

                if ls_key.startswith('\x01'):
                    ls_key = ls_key.lstrip('\x01')

                elif ls_key.startswith('\x00'):
                    ls_key = ls_key.lstrip('\x00').decode('utf-16')
            except Exception as e:
                logger.error("Origin/key parsing error: {}".format(e))

        try:
            ls_value = value

            if ls_value.startswith('\x01'):
                ls_value = ls_value.lstrip('\x01')

            elif ls_value.startswith('\x00'):
                ls_value = ls_value.lstrip('\x00').decode('utf-16', errors='replace')

            elif ls_value.startswith('\x08'):
                ls_value = ls_value.lstrip('\x08')

        except Exception as e:
            logger.error("Value parsing error: {}".format(e))

        return {'origin': origin, 'key': ls_key, 'value': ls_value}

    @staticmethod
    def extract_media_router_info(ls_list):
        found_networks = []
        found_devices = []
        for entry in ls_list:
            if entry['origin'] is None:
                continue
            elif 'pkedcjkdefgpdelpbcmbmeomcjbeemfm' in entry['origin']:
                if entry['key'].startswith('mr.persistent.cast.NetworkSink'):
                    try:
                        sm = json.loads(entry['value'])
                        networks = sm['networkIds'].split(',')
                        for network in networks:
                            found_networks.append(network)

                        for id in sm['sinkMap'].keys():
                            found_devices.append({
                                'ip': sm['sinkMap'][id]['ip'],
                                'modelName': sm['sinkMap'][id]['modelName'],
                                'friendlyName': sm['sinkMap'][id]['friendlyName'],
                                'networks': sm['networkIds']
                            })
                    except:
                        logger.warning("Problem parsing MediaRouter entry: {}".format(str(entry)))

        return {'networks': found_networks, 'devices': found_devices}

    @staticmethod
    def make_lon(geo_df):
        return [float(geo_df['lon'].min()) - 3.0, float(geo_df['lon'].max()) + 3.0]

    @staticmethod
    def make_lat(geo_df):
        lon_range = syn.make_lon(geo_df)
        return [float(geo_df['lat'].min()) - 2.0, float(geo_df['lat'].max()) + 2.0]

    @staticmethod
    def append_df_to_json(df_name, df, original):
        if df_name in original.keys():
            original[df_name].extend(df.to_dict('records'))
        else:
            original.update({df_name: df.to_dict('records')})
        return original

    @staticmethod
    def append_to_json(list_name, list_to_add, original):
        if list_name in original.keys():
            original[list_name].extend(list_to_add)
        else:
            original.update({list_name: list_to_add})
        return original

    def dump_to_var_js(self, syn, var_js_path):

        with open(var_js_path, 'w') as f:
            if syn.get('geolocation'):
                f.write('var geolocation = {}\n\n'.format(json.dumps(syn['geolocation'], indent=2, default=str)))

            if syn.get('media_router'):
                if syn['media_router'].get('devices'):
                    f.write('var devices = {}\n\n'.format(json.dumps(syn['media_router']['devices'], indent=2, default=str)))
                if syn['media_router'].get('networks'):
                    f.write('var networks = {}\n\n'.format(json.dumps(syn['media_router']['networks'], indent=2, default=str)))

            if syn.get('heatmap'):
                f.write('var heatmap = {}\n\n'.format(json.dumps(syn['heatmap'], indent=2, default=str)))

            if syn.get('accounts'):
                f.write('var accounts = {}\n\n'.format(json.dumps(syn['accounts'], indent=2, default=str)))

            if syn.get('autofill'):
                f.write('var autofill = {}\n\n'.format(json.dumps(syn['autofill'], indent=2, default=str)))

            if syn.get('preferences'):
                f.write('var preferences = {}\n\n'.format(json.dumps(syn['preferences'], indent=2, default=str)))

            if syn.get('search_word_cloud'):
                f.write('var search_word_cloud = {}\n\n'.format(json.dumps(syn['search_word_cloud'], indent=2, default=str)))

            if syn.get('autofill_word_cloud'):
                f.write('var autofill_word_cloud = {}\n\n'.format(json.dumps(syn['autofill_word_cloud'], indent=2, default=str)))

            if syn.get('searches'):
                f.write('var searches = {}\n\n'.format(json.dumps(syn['searches'], indent=2, default=str)))

            if syn.get('visits'):
                f.write('var visits = {}\n\n'.format(json.dumps(syn['visits'], indent=2, default=str)))


if __name__ == '__main__':

    # Read in the location of the browser data to parse from the cmdline
    syn = Synopsis(sys.argv[1])
    syn_json = {}

    # visits_df powers the 'Activity by Domain', 'Activity by Time of Day', and 'Search Engine Query' cards
    visits_df = syn.load_visits_data_frame(os.path.join(syn.profile_path, 'History'))
    syn_json = syn.append_df_to_json('visits', visits_df[['domain', 'url', 'visit_time']], syn_json)

    # searches_df used the visits_df and powers the 'Search Engine Query' card
    searches_df = syn.extract_searches_from_visits_data_frame(visits_df, domains=['www.google.com', 'www.bing.com', 'duckduckgo.com'])
    syn_json = syn.append_df_to_json('searches', searches_df, syn_json)

    # searches_word_cloud
    search_word_cloud = syn.create_search_word_cloud(searches_df)
    syn_json = syn.append_to_json('search_word_cloud', search_word_cloud, syn_json)

    # accounts_table_data uses the visits_df and Login Data sqlite file and powers the 'Extracted Accounts' card
    accounts_table_data = syn.make_accounts_table(visits_df=visits_df, logins_sqlite_file=os.path.join(syn.profile_path, 'Login Data'))
    syn_json = syn.append_to_json('accounts', accounts_table_data, syn_json)

    # user_info is extracted from the Preferences JSON file and powers the 'Browser Account Info' card
    user_info = syn.extract_user_info_from_preferences(os.path.join(syn.profile_path, 'Preferences'))
    syn_json = syn.append_to_json('preferences', user_info, syn_json)

    # autofill_df powers the "Autofill Entries" cards
    autofill_df = syn.load_autofill_data_frame(os.path.join(syn.profile_path, 'Web Data'))
    syn_json = syn.append_df_to_json('autofill', autofill_df, syn_json)

    # autofill_word_cloud
    autofill_word_cloud = syn.create_autofill_word_cloud(autofill_df)
    syn_json = syn.append_to_json('autofill_word_cloud', autofill_word_cloud, syn_json)

    # geo_df powers the "Geolocation" card. Uses ip-api.com for lookups.
    geos = syn.extract_geolocation_from_cookies(os.path.join(syn.profile_path, 'Cookies'))
    geo_df = syn.plot_geos(geos)
    syn_json = syn.append_df_to_json('geolocation', geo_df, syn_json)

    # local_storage is extracted from Chrome's localStorage leveldb store and powers media_router and some geolocation.
    local_storage = syn.load_local_storage(os.path.join(syn.profile_path, 'Local Storage', 'leveldb'))
    ls_geos = syn.extract_geolocation_from_local_storage(local_storage)
    ls_geo_df = syn.plot_geos(ls_geos)
    syn_json = syn.append_df_to_json('geolocation', ls_geo_df, syn_json)
    # syn_json = syn.append_to_json('local_storage', local_storage, syn_json)  # this is too verbose right now and not really necessary, so removing it.

    # media_router_info extracts info about local network devices available for casting
    media_router_info = syn.extract_media_router_info(local_storage)
    syn_json = syn.append_to_json('media_router', media_router_info, syn_json)

    # The heatmap_df uses the visits_df and powers the 'Activity by Time of Day' card
    heatmap_df = syn.refine_visits_data_frame(visits_df, resample="DoW")
    heatmap_df = heatmap_df.fillna(0)
    z = heatmap_df.values.tolist(),
    y = heatmap_df.index.values,
    x = heatmap_df.columns.values
    syn_json = syn.append_df_to_json('heatmap', heatmap_df, syn_json)

    # Dump everything to JSON file
    with open('synopsis_{}.json'.format(time.strftime('%Y-%m-%dT%H-%M-%S')), 'w') as f:
        json.dump(syn_json, f, sort_keys=True, indent=2, default=str)
