import Order from "@/models/Order";


export async function OrdersSearch ({q, productsPerPage, page}){
    //console.log(options);
    console.log(q)
  let project;
  //if(process.env.NODE_ENV == "development"){
  project = {
    meta: "$$SEARCH_META",
    _id: 1,
    score: {
      $meta: "searchScore",
    },
  };

  console.log(page, "__PAGE");
  let skip = page * productsPerPage - productsPerPage;

  let query = [
    {
      $search: {
        index: "default",
        text: {
          query: q,
          path: ["poNumber", "shippingAddress.name", "shippingAddress.address", "shippingAddress.city", "shippingAddress.state", "shippingAddress.postalCode"],
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
  console.log(query[0]["$search"])
  
  let orders = await Order.aggregate([query]);
  //console.log("something", time);
  console.log("stan search designs ", orders[0]);
  return orders;
}