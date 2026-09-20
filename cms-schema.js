/* 北投旅圖共用欄位定義：由 2026-09-19 原始 admin.html 及 Supabase 欄位清單核對產生。
 * 只負責欄位定義，不連線資料庫、不修改資料。 */
(function(global){
'use strict';
const definitions={
  "spots": {
    "fields": [
      [
        "id",
        "ID",
        "text",
        "auto"
      ],
      [
        "sort_order",
        "排序數字",
        "number"
      ],
      [
        "slug",
        "網址代稱 slug",
        "text"
      ],
      [
        "title",
        "景點名稱",
        "text",
        "required"
      ],
      [
        "area",
        "地區",
        "text"
      ],
      [
        "station",
        "最近捷運站",
        "text"
      ],
      [
        "summary",
        "摘要",
        "textarea"
      ],
      [
        "content",
        "介紹內容",
        "textarea"
      ],
      [
        "address",
        "地址",
        "text"
      ],
      [
        "business_hours",
        "營業時間",
        "text"
      ],
      [
        "stay_time",
        "建議停留",
        "text"
      ],
      [
        "tags",
        "標籤",
        "text"
      ],
      [
        "notes",
        "備註",
        "textarea"
      ],
      [
        "google_map",
        "Google Map連結",
        "text"
      ],
      [
        "official_website",
        "官方網站",
        "text"
      ],
      [
        "cover_image",
        "封面圖（3:2，建議 1500×1000）",
        "image"
      ],
      [
        "cover_image_source",
        "封面圖片來源",
        "text"
      ],
      [
        "is_published",
        "狀態",
        "boolean"
      ],
      [
        "transport_routes",
        "交通路線（JSON）",
        "json"
      ],
      [
        "transport_metro",
        "transport_metro",
        "textarea"
      ],
      [
        "transport_bus",
        "transport_bus",
        "textarea"
      ],
      [
        "transport_car",
        "transport_car",
        "textarea"
      ],
      [
        "source_urls",
        "資料來源網址",
        "textarea"
      ]
    ],
    "tabs": {
      "basic": [
        "id",
        "slug",
        "title",
        "area",
        "summary",
        "address",
        "stay_time",
        "tags",
        "notes",
        "official_website"
      ],
      "detail": [
        "content"
      ],
      "transport": [
        "station",
        "transport_routes",
        "transport_metro",
        "transport_bus",
        "transport_car",
        "google_map"
      ],
      "images": [
        "cover_image",
        "cover_image_source"
      ],
      "settings": [
        "sort_order",
        "source_urls",
        "is_published",
        "business_hours"
      ]
    }
  },
  "foods": {
    "fields": [
      [
        "id",
        "ID",
        "text",
        "auto"
      ],
      [
        "sort_order",
        "排序數字",
        "number"
      ],
      [
        "slug",
        "網址代稱 slug",
        "text"
      ],
      [
        "title",
        "店名",
        "text",
        "required"
      ],
      [
        "category",
        "類型",
        "text"
      ],
      [
        "address",
        "地址",
        "text"
      ],
      [
        "business_hours",
        "營業時間",
        "text"
      ],
      [
        "phone",
        "電話",
        "text"
      ],
      [
        "average_cost",
        "平均消費",
        "text"
      ],
      [
        "price_range",
        "價格區間",
        "text"
      ],
      [
        "tags",
        "標籤",
        "text"
      ],
      [
        "notes",
        "備註",
        "textarea"
      ],
      [
        "google_map",
        "Google Map連結",
        "text"
      ],
      [
        "official_website",
        "官方網站",
        "text"
      ],
      [
        "summary",
        "摘要",
        "textarea"
      ],
      [
        "content",
        "介紹內容",
        "textarea"
      ],
      [
        "cover_image",
        "封面圖（3:2，建議 1500×1000）",
        "image"
      ],
      [
        "cover_image_source",
        "封面圖片來源",
        "text"
      ],
      [
        "is_published",
        "狀態",
        "boolean"
      ],
      [
        "station",
        "鄰近捷運站",
        "textarea"
      ],
      [
        "transport_routes",
        "交通路線（JSON）",
        "json"
      ],
      [
        "source_urls",
        "資料來源網址",
        "textarea"
      ]
    ],
    "tabs": {
      "basic": [
        "id",
        "slug",
        "title",
        "category",
        "summary",
        "address",
        "business_hours",
        "phone",
        "average_cost",
        "tags",
        "notes",
        "official_website"
      ],
      "detail": [
        "content"
      ],
      "transport": [
        "station",
        "transport_routes",
        "google_map"
      ],
      "images": [
        "cover_image",
        "cover_image_source"
      ],
      "settings": [
        "sort_order",
        "source_urls",
        "is_published"
      ]
    }
  },
  "trips": {
    "fields": [
      [
        "id",
        "ID",
        "text",
        "auto"
      ],
      [
        "sort_order",
        "排序數字",
        "number"
      ],
      [
        "slug",
        "網址代稱 slug",
        "text"
      ],
      [
        "title",
        "行程名稱",
        "text",
        "required"
      ],
      [
        "duration",
        "建議時間",
        "text"
      ],
      [
        "summary",
        "摘要",
        "textarea"
      ],
      [
        "google_route",
        "Google路線",
        "text"
      ],
      [
        "transport_routes",
        "大眾運輸交通指南",
        "json"
      ],
      [
        "cover_image",
        "封面圖（3:2，建議 1500×1000）",
        "image"
      ],
      [
        "cover_image_source",
        "封面圖片來源",
        "text"
      ],
      [
        "trip_sections",
        "行程分段",
        "sections"
      ],
      [
        "is_published",
        "狀態",
        "boolean"
      ],
      [
        "source_urls",
        "資料來源網址",
        "textarea"
      ]
    ],
    "tabs": {
      "basic": [
        "id",
        "slug",
        "title",
        "duration",
        "summary"
      ],
      "detail": [
        "trip_sections"
      ],
      "transport": [
        "google_route",
        "transport_routes"
      ],
      "images": [
        "cover_image",
        "cover_image_source"
      ],
      "settings": [
        "sort_order",
        "source_urls",
        "is_published"
      ]
    }
  }
};
const tabNames={basic:'基本資訊',detail:'詳細內容',transport:'交通指南',images:'圖片管理',settings:'其他設定'};
const api=Object.freeze({
  types:Object.freeze(Object.keys(definitions)),
  tabs:Object.freeze(tabNames),
  hasType(type){return Object.prototype.hasOwnProperty.call(definitions,type);},
  fields(type){if(!this.hasType(type))throw Error('不支援的內容分類：'+type);return definitions[type].fields.map(f=>f.slice());},
  groups(type){if(!this.hasType(type))throw Error('不支援的內容分類：'+type);return Object.fromEntries(Object.entries(definitions[type].tabs).map(([key,names])=>[key,names.slice()]));},
  fieldsForTab(type,tab){const groups=this.groups(type);if(!Object.prototype.hasOwnProperty.call(groups,tab))throw Error('未知分頁：'+tab);const names=new Set(groups[tab]);return this.fields(type).filter(f=>names.has(f[0]));},
  writable(type,record){const names=new Set(this.fields(type).map(f=>f[0]));return Object.fromEntries(Object.entries(record).filter(([key])=>names.has(key)));}
});
global.MetroCmsSchema=api;
})(typeof window!=='undefined'?window:globalThis);
