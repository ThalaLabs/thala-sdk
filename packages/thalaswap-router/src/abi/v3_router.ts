export const V3_ROUTER_ABI = {
  address: "0x1d2bd7dd7641e65a9706d4c72bea0b1aa48a41217c481c49e41b9456d7143d0a",
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
        "vector<address>",
        "vector<0x1::object::Object<0x1::fungible_asset::Metadata>>",
        "0x1::object::Object<0x1::fungible_asset::Metadata>",
        "u64",
      ],
      return: ["u64"],
    },
    {
      name: "simulate_out_given_in",
      visibility: "public",
      is_entry: false,
      is_view: true,
      generic_type_params: [],
      params: [
        "vector<address>",
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
        "vector<address>",
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
        "vector<address>",
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
        "vector<address>",
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
      is_event: false,
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
