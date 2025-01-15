export const COIN_WRAPPER_ABI = {
  address: "0x47078bc1e50f803987fbbf69b706cebb29ea4a54dac8b0ce2d9e7af90a41d02f",
  name: "coin_wrapper",
  friends: [],
  exposed_functions: [
    {
      name: "add_liquidity_metastable",
      visibility: "public",
      is_entry: true,
      is_view: false,
      generic_type_params: [
        {
          constraints: [],
        },
        {
          constraints: [],
        },
        {
          constraints: [],
        },
        {
          constraints: [],
        },
      ],
      params: [
        "&signer",
        "0x1::object::Object<0x47078bc1e50f803987fbbf69b706cebb29ea4a54dac8b0ce2d9e7af90a41d02f::pool::Pool>",
        "vector<u64>",
        "u64",
      ],
      return: [],
    },
    {
      name: "add_liquidity_stable",
      visibility: "public",
      is_entry: true,
      is_view: false,
      generic_type_params: [
        {
          constraints: [],
        },
        {
          constraints: [],
        },
        {
          constraints: [],
        },
        {
          constraints: [],
        },
        {
          constraints: [],
        },
        {
          constraints: [],
        },
      ],
      params: [
        "&signer",
        "0x1::object::Object<0x47078bc1e50f803987fbbf69b706cebb29ea4a54dac8b0ce2d9e7af90a41d02f::pool::Pool>",
        "vector<u64>",
        "u64",
      ],
      return: [],
    },
    {
      name: "add_liquidity_weighted",
      visibility: "public",
      is_entry: true,
      is_view: false,
      generic_type_params: [
        {
          constraints: [],
        },
        {
          constraints: [],
        },
        {
          constraints: [],
        },
        {
          constraints: [],
        },
      ],
      params: [
        "&signer",
        "0x1::object::Object<0x47078bc1e50f803987fbbf69b706cebb29ea4a54dac8b0ce2d9e7af90a41d02f::pool::Pool>",
        "vector<u64>",
        "u64",
      ],
      return: [],
    },
    {
      name: "create_pool_metastable",
      visibility: "public",
      is_entry: true,
      is_view: false,
      generic_type_params: [
        {
          constraints: [],
        },
        {
          constraints: [],
        },
        {
          constraints: [],
        },
        {
          constraints: [],
        },
      ],
      params: [
        "&signer",
        "vector<0x1::object::Object<0x1::fungible_asset::Metadata>>",
        "vector<u64>",
        "u64",
        "u64",
      ],
      return: [],
    },
    {
      name: "create_pool_stable",
      visibility: "public",
      is_entry: true,
      is_view: false,
      generic_type_params: [
        {
          constraints: [],
        },
        {
          constraints: [],
        },
        {
          constraints: [],
        },
        {
          constraints: [],
        },
        {
          constraints: [],
        },
        {
          constraints: [],
        },
      ],
      params: [
        "&signer",
        "vector<0x1::object::Object<0x1::fungible_asset::Metadata>>",
        "vector<u64>",
        "u64",
        "u64",
      ],
      return: [],
    },
    {
      name: "create_pool_weighted",
      visibility: "public",
      is_entry: true,
      is_view: false,
      generic_type_params: [
        {
          constraints: [],
        },
        {
          constraints: [],
        },
        {
          constraints: [],
        },
        {
          constraints: [],
        },
      ],
      params: [
        "&signer",
        "vector<0x1::object::Object<0x1::fungible_asset::Metadata>>",
        "vector<u64>",
        "vector<u64>",
        "u64",
      ],
      return: [],
    },
    {
      name: "swap_exact_in_metastable",
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
        "0x1::object::Object<0x47078bc1e50f803987fbbf69b706cebb29ea4a54dac8b0ce2d9e7af90a41d02f::pool::Pool>",
        "0x1::object::Object<0x1::fungible_asset::Metadata>",
        "u64",
        "0x1::object::Object<0x1::fungible_asset::Metadata>",
        "u64",
      ],
      return: [],
    },
    {
      name: "swap_exact_in_stable",
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
        "0x1::object::Object<0x47078bc1e50f803987fbbf69b706cebb29ea4a54dac8b0ce2d9e7af90a41d02f::pool::Pool>",
        "0x1::object::Object<0x1::fungible_asset::Metadata>",
        "u64",
        "0x1::object::Object<0x1::fungible_asset::Metadata>",
        "u64",
      ],
      return: [],
    },
    {
      name: "swap_exact_in_weighted",
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
        "0x1::object::Object<0x47078bc1e50f803987fbbf69b706cebb29ea4a54dac8b0ce2d9e7af90a41d02f::pool::Pool>",
        "0x1::object::Object<0x1::fungible_asset::Metadata>",
        "u64",
        "0x1::object::Object<0x1::fungible_asset::Metadata>",
        "u64",
      ],
      return: [],
    },
    {
      name: "swap_exact_out_metastable",
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
        "0x1::object::Object<0x47078bc1e50f803987fbbf69b706cebb29ea4a54dac8b0ce2d9e7af90a41d02f::pool::Pool>",
        "0x1::object::Object<0x1::fungible_asset::Metadata>",
        "u64",
        "0x1::object::Object<0x1::fungible_asset::Metadata>",
        "u64",
      ],
      return: [],
    },
    {
      name: "swap_exact_out_stable",
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
        "0x1::object::Object<0x47078bc1e50f803987fbbf69b706cebb29ea4a54dac8b0ce2d9e7af90a41d02f::pool::Pool>",
        "0x1::object::Object<0x1::fungible_asset::Metadata>",
        "u64",
        "0x1::object::Object<0x1::fungible_asset::Metadata>",
        "u64",
      ],
      return: [],
    },
    {
      name: "swap_exact_out_weighted",
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
        "0x1::object::Object<0x47078bc1e50f803987fbbf69b706cebb29ea4a54dac8b0ce2d9e7af90a41d02f::pool::Pool>",
        "0x1::object::Object<0x1::fungible_asset::Metadata>",
        "u64",
        "0x1::object::Object<0x1::fungible_asset::Metadata>",
        "u64",
      ],
      return: [],
    },
  ],
  structs: [
    {
      name: "Notacoin",
      is_native: false,
      is_event: false,
      abilities: [],
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
