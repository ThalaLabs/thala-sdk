export const STABLE_POOL_SCRIPTS_ABI = {
  address: "0x9cf21a8d229e5a9bb99b14a78d232ecb6dbf7049c861b5411ce3b5bb425e3728",
  name: "stable_pool_scripts",
  friends: [],
  exposed_functions: [
    {
      name: "add_liquidity",
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
      params: ["&signer", "u64", "u64", "u64", "u64"],
      return: [],
    },
    {
      name: "remove_liquidity",
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
      params: ["&signer", "u64", "u64", "u64", "u64", "u64"],
      return: [],
    },
    {
      name: "swap_exact_in",
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
      params: ["&signer", "u64", "u64"],
      return: [],
    },
    {
      name: "swap_exact_out",
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
      params: ["&signer", "u64", "u64"],
      return: [],
    },
  ],
  structs: [],
} as const;
