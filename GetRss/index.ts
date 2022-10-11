import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import https = require("https");
import cheerio = require("cheerio");
import moment = require("moment");
import { toXML } from "jstoxml";

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  const url = "https://www.ogb.go.jp";
  const axios = require("axios");
  axios.defaults.httpsAgent = new https.Agent({ rejectUnauthorized: false });

  const response = await axios.get(url);
  const $ = cheerio.load(response.data);

  const items = [];
  $("#mainContentsWrapper table tr").map((i, tr) => {
    const category = $(tr).find("th span").text();
    const date = $(tr).find("th p.date").text();
    const pubDate = moment(date, "YYYY年MM月DD日").format(
      "ddd, DD MMM YYYY 10:mm:ss +0900"
    );

    const td1 = $(tr).find("td")[0];
    const a = $(td1).find("a").first();
    const href = a.attr("href");
    const link = href.startsWith('http') ? href : url + href
    const content = a.text().trim();

    const td2 = $(tr).find("td")[1];
    const department = $(td2).text().trim();

    const description = "";

    const title = `[${department}] ${content}`

    items.push({ title, description, link, pubDate, category });
  });

  const channel = [];
  channel.push({ title: "内閣府・沖縄総合事務局 新着情報" });
  channel.push({ link: "https://www.ogb.go.jp/news" });
  items.forEach((item) => {
    channel.push({ item: item });
  });

  const feed = {
    rss: {
      _attrs: {
        version: "2.0",
        "xmlns:dc": "http://purl.org/dc/elements/1.1/",
        "xml:lang": "ja",
      },
      channel,
    },
  };

  const rss = toXML(feed);

  context.res = {
    body: rss,
    headers: {
      "Content-Type": "application/xml",
    },
  };
};

export default httpTrigger;
