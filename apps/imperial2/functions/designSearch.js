import Design from "@/models/Design";


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
        compound: {
          must: [
            {phrase: {
                query: q.split(" "),
                path: ["name"],
                slop: 1,
              },}
          ]
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

  
  let designs = await Design.aggregate([query]);
  //console.log("something", time);
  console.log("stan search designs ", designs[0]);
  return designs;
}