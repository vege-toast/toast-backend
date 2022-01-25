import requests
import json
from bs4 import BeautifulSoup

# 코스피 35페이지, 코스닥 31페이지

pcBaseUrl = "https://finance.naver.com/item/main.nhn?code="
mobileBaseUrl = "https://m.stock.naver.com/index.html#/domestic/stock/"

count = 0
stockCodeJson = {}
for i in range(2):
    for j in range(36):
        if i == 1 & j >= 36: break 
        else:
            pageUrl = "https://finance.naver.com/sise/sise_market_sum.nhn?sosok=" + str(i) + "&page=" + str(j)
            req = requests.get(pageUrl)
            soup = BeautifulSoup(req.content, 'html.parser', from_encoding='euc-kr')
            hrefList = soup.select('table.type_2 > tbody > tr > td > a')
            for k, a in enumerate(hrefList, start = 1):
                if k % 2 == 1:
                    print(a.text.strip(), a['href'])
                    string = str(a['href'])
                    code = string[-6:]
                    stockCodeJson[a.text.strip()] = pcBaseUrl + code
                    count += 1
                else: continue

print(json.dumps(stockCodeJson, ensure_ascii=False, indent ="\t"))
print("총 %d 개의 종목입니다" % count)

with open('stockCodeUrl.json', 'w', encoding='utf-8') as file :
    json.dump(stockCodeJson, file, ensure_ascii=False, indent='\t')
