export const V2_ROUTER_ABI = {
  address: "0xc36ceb6d7b137cea4897d4bc82d8e4d8be5f964c4217dbc96b0ba03cc64070f4",
  name: "router",
  friends: [],
  exposed_functions: [
    {
      name: "simulate_in_given_out",
      visibility: "public",
      is_entry: false,
      is_view: true,
      generic_type_params: [],
      params: [
        "vector<0x1::object::Object<0xfbdb3da73efcfa742d542f152d65fc6da7b55dee864cd66475213e4be18c9d54::pool::Pool>>",
        "vector<0x1::object::Object<0x1::fungible_asset::Metadata>>",
        "0x1::object::Object<0x1::fungible_asset::Metadata>",
        "u64",
      ],
      return: ["u64"],
    },
    {
      name: "swap_exact_in_router_entry",
      visibility: "public",
      is_entry: true,
      is_view: false,
      generic_type_params: [
        {
          constraints: [],
        },
      ],
      params: [
        "&signer",
        "vector<0x1::object::Object<0xfbdb3da73efcfa742d542f152d65fc6da7b55dee864cd66475213e4be18c9d54::pool::Pool>>",
        "vector<0x1::object::Object<0x1::fungible_asset::Metadata>>",
        "u64",
        "0x1::object::Object<0x1::fungible_asset::Metadata>",
        "u64",
      ],
      return: [],
    },
    {
      name: "swap_exact_out_router_entry",
      visibility: "public",
      is_entry: true,
      is_view: false,
      generic_type_params: [
        {
          constraints: [],
        },
      ],
      params: [
        "&signer",
        "vector<0x1::object::Object<0xfbdb3da73efcfa742d542f152d65fc6da7b55dee864cd66475213e4be18c9d54::pool::Pool>>",
        "vector<0x1::object::Object<0x1::fungible_asset::Metadata>>",
        "u64",
        "0x1::object::Object<0x1::fungible_asset::Metadata>",
        "u64",
      ],
      return: [],
    },
    {
      name: "swap_route",
      visibility: "public",
      is_entry: false,
      is_view: false,
      generic_type_params: [],
      params: [
        "&signer",
        "vector<0x1::object::Object<0xfbdb3da73efcfa742d542f152d65fc6da7b55dee864cd66475213e4be18c9d54::pool::Pool>>",
        "vector<0x1::object::Object<0x1::fungible_asset::Metadata>>",
        "0x1::fungible_asset::FungibleAsset",
      ],
      return: ["0x1::fungible_asset::FungibleAsset"],
    },
  ],
  structs: [
    {
      name: "Notacoin",
      is_native: false,
      abilities: ["key"],
      generic_type_params: [],
      fields: [
        {
          name: "dummy_field",
          type: "bool",
        },
      ],
    },
  ],
} as const;
