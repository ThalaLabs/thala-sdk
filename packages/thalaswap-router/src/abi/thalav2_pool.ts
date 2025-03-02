export const THALAV2_POOL_ABI = {
  address: "0xeeadd07bb5e307ea3b3fb312bea4d1876526e63b9d00c3d09acca6d3744eecea",
  name: "lens",
  friends: [],
  exposed_functions: [
    {
      name: "account_lpts",
      visibility: "public",
      is_entry: false,
      is_view: true,
      generic_type_params: [],
      params: ["address"],
      return: ["vector<0x1::object::Object<0x1::fungible_asset::Metadata>>"],
    },
    {
      name: "get_all_pools_info",
      visibility: "public",
      is_entry: false,
      is_view: true,
      generic_type_params: [],
      params: [],
      return: [
        "vector<0xeeadd07bb5e307ea3b3fb312bea4d1876526e63b9d00c3d09acca6d3744eecea::lens::PoolInfo>",
      ],
    },
    {
      name: "get_pool_count",
      visibility: "public",
      is_entry: false,
      is_view: true,
      generic_type_params: [],
      params: [],
      return: ["u64"],
    },
    {
      name: "get_pool_info",
      visibility: "public",
      is_entry: false,
      is_view: true,
      generic_type_params: [],
      params: [
        "0x1::object::Object<0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::Pool>",
      ],
      return: [
        "0xeeadd07bb5e307ea3b3fb312bea4d1876526e63b9d00c3d09acca6d3744eecea::lens::PoolInfo",
      ],
    },
    {
      name: "get_pools_info",
      visibility: "public",
      is_entry: false,
      is_view: true,
      generic_type_params: [],
      params: [
        "vector<0x1::object::Object<0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::Pool>>",
      ],
      return: [
        "vector<0xeeadd07bb5e307ea3b3fb312bea4d1876526e63b9d00c3d09acca6d3744eecea::lens::PoolInfo>",
      ],
    },
    {
      name: "get_pools_paginated",
      visibility: "public",
      is_entry: false,
      is_view: true,
      generic_type_params: [],
      params: ["u64", "u64"],
      return: [
        "vector<0xeeadd07bb5e307ea3b3fb312bea4d1876526e63b9d00c3d09acca6d3744eecea::lens::PoolInfo>",
      ],
    },
  ],
  structs: [
    {
      name: "PoolInfo",
      is_native: false,
      is_event: false,
      abilities: ["drop"],
      generic_type_params: [],
      fields: [
        {
          name: "pool",
          type: "0x1::object::Object<0x7730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5::pool::Pool>",
        },
        {
          name: "pool_type",
          type: "u8",
        },
        {
          name: "swap_fee_bps",
          type: "u64",
        },
        {
          name: "lp_token_metadata",
          type: "0x1::object::Object<0x1::fungible_asset::Metadata>",
        },
        {
          name: "lp_token_supply",
          type: "u64",
        },
        {
          name: "assets_metadata",
          type: "vector<0x1::object::Object<0x1::fungible_asset::Metadata>>",
        },
        {
          name: "balances",
          type: "vector<u64>",
        },
        {
          name: "weights_opt",
          type: "0x1::option::Option<vector<u64>>",
        },
        {
          name: "amp_factor_opt",
          type: "0x1::option::Option<u64>",
        },
        {
          name: "precision_multipliers_opt",
          type: "0x1::option::Option<vector<u64>>",
        },
        {
          name: "balances_normalized_opt",
          type: "0x1::option::Option<vector<u128>>",
        },
        {
          name: "rates_opt",
          type: "0x1::option::Option<vector<u128>>",
        },
        {
          name: "oracle_names_opt",
          type: "0x1::option::Option<vector<0x1::string::String>>",
        },
      ],
    },
  ],
} as const;
