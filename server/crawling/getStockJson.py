import requests
import json
from bs4 import BeautifulSoup
from collections import OrderedDict

url = 'https://finance.naver.com/sise/sise_quant.nhn'
req = requests.get(url)
soup = BeautifulSoup(req.content, 'html.parser', from_encoding='euc-kr')

jsonData = OrderedDict()
top100 = soup.select('td > a')
for i, t in enumerate(top100, 1):
    stockJson = OrderedDict()
    stockJson["stock_name"] = t.text.strip()
    s = t.parent.find_next_sibling('td')
    stockJson["price"] = s.text.strip()
    s = s.find_next_sibling('td')
    stockJson["compared_to_previous_day"] = s.text.strip()
    s = s.find_next_sibling('td')
    stockJson["rate_of_updown"] = s.text.strip()
    s = s.find_next_sibling('td')
    stockJson["transaction_volume"] = s.text.strip()
    s = s.find_next_sibling('td')
    stockJson["transaction_payment"] = s.text.strip()
    s = s.find_next_sibling('td')
    stockJson["buying_price"] = s.text.strip()
    s = s.find_next_sibling('td')
    stockJson["selling_price"] = s.text.strip()
    s = s.find_next_sibling('td')
    stockJson["market_capitalization"] = s.text.strip()
    s = s.find_next_sibling('td')
    stockJson["PER"] = s.text.strip()
    s = s.find_next_sibling('td')
    stockJson["ROE"] = s.text.strip()
    jsonData[i] = stockJson
print(json.dumps(jsonData, ensure_ascii=False, indent ="\t"))