import requests
import json
from bs4 import BeautifulSoup
from collections import OrderedDict

url = 'https://finance.naver.com/sise/sise_quant.nhn'
req = requests.get(url)
soup = BeautifulSoup(req.content, 'html.parser', from_encoding='euc-kr')

jsonData = OrderedDict()

header = soup.select('table.type_2 > tr > th')
for h in header:
    print(h.text.strip(), end = '\t')
print()
top100 = soup.select('td > a')
for i, t in enumerate(top100, 1):
    print(i, t.text.strip(), end ='\t')
    s = t.parent.find_next_sibling('td')
    while(s):
        print(s.text.strip(), end = '\t')
        s = s.find_next_sibling('td')
    print('')