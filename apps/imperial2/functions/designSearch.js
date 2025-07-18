import {Design} from "@pythias/mongo";


export async function DesignSearch ({q, productsPerPage, page}){
    //console.log(options);
    console.log(q)
  let project;
  //if(process.env.NODE_ENV == "development"){
  project = {
    meta: "$$SEARCH_META",
    _id: 1,
    name: 1,
    images: 1,
    sku: 1,
    sendToMarketplaces: 1,
    b2m: 1,
    blanks: 1,
    brands: 1,
    cleaned: 1,
    description: 1,
    threadColors: 1,
    threadImages: 1,
    score: {
      $meta: "searchScore",
    },
  };

  console.log(page, "__PAGE");
  let skip = page * productsPerPage - productsPerPage;

  let query = [
    {
      $search: {
        index: "designs",
        text: {
          query: q,
          path: "name",
          fuzzy: {
            maxEdits: 2,
            prefixLength: 3,
            maxExpansions: 2
          },
          matchCriteria: "any"
        },
        count: {
          type: "total",
        },
      },
    },
    {
      $project: project,
    },
    {
      $skip: skip,
    },
    {
      $limit: productsPerPage,
    },
  ];
  //console.log(query[0]["$search"].phrase)
  
  let designs = await Design.aggregate([query]);
  //console.log("something", time);
  //console.log("stan search designs ", designs[0]);
  return designs;
}