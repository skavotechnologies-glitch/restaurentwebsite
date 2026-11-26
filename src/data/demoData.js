// Default seed data for Naachi Café and multi-restaurant support

export const DEMO_RESTAURANT = {
  id: "naachi-cafe",
  slug: "naachi-cafe",
  name: "Naachi Café",
  tagline: "Authentic Sips & South-Indian Delights",
  description: "Serving piping hot filter coffee, traditional handmade teas, fresh seasonal juices, and authentic crisp snacks since 1998.",
  logo: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=200&q=80",
  coverImage: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1200&q=80",
  address: "Shop 14, 100ft Road, Indiranagar, Bengaluru, Karnataka 560038",
  phone: "+91 98765 43210",
  whatsapp: "+91 98765 43210",
  email: "contact@naachicafe.com",
  openingHours: "7:00 AM - 10:30 PM",
  isOpen: true,
  onlineOrderingEnabled: true,
  estimatedPrepTime: "10-15 mins",
  allowCustomerInstructions: true,
  hideSoldOut: false,
  notificationSound: true,
  
  // Branding
  theme: {
    primaryColor: "#183D2B", // Forest green
    accentColor: "#C59A5B",  // Muted gold
    bgColor: "#FAF7F2",      // Warm cream
  },

  // Billing & Tax settings
  billing: {
    currency: "₹",
    currencyCode: "INR",
    gstEnabled: true,
    cGstRate: 2.5, // 2.5% CGST
    sGstRate: 2.5, // 2.5% SGST
    serviceChargeRate: 0,
    discountRate: 0,
    gstin: "29AAAAA0000A1Z5",
    upiId: "palanikathirvel05@okaxis",
    upiPayeeName: "Naachi Café",
    billFooterMessage: "Thank you for dining with Naachi Café! Please pay directly at the counter.",
  }
};

export const DEMO_CATEGORIES = [
  {
    id: "cat-tea-coffee",
    restaurantId: "naachi-cafe",
    name: "Tea & Coffee",
    icon: "Coffee",
    order: 1,
    isActive: true,
  },
  {
    id: "cat-juice",
    restaurantId: "naachi-cafe",
    name: "Fresh Juice",
    icon: "GlassWater",
    order: 2,
    isActive: true,
  },
  {
    id: "cat-snacks",
    restaurantId: "naachi-cafe",
    name: "Snacks",
    icon: "Utensils",
    order: 3,
    isActive: true,
  },
  {
    id: "cat-mains",
    restaurantId: "naachi-cafe",
    name: "Mains & Biriyani",
    icon: "Flame",
    order: 4,
    isActive: true,
  },
  {
    id: "cat-desserts",
    restaurantId: "naachi-cafe",
    name: "Desserts",
    icon: "IceCream",
    order: 5,
    isActive: true,
  }
];

export const DEMO_MENU_ITEMS = [
  // Tea & Coffee
  {
    id: "item-tea",
    restaurantId: "naachi-cafe",
    categoryId: "cat-tea-coffee",
    name: "Tea",
    description: "Classic brewed Indian milk chai with aromatic spices and fresh dairy milk.",
    price: 12,
    prepTime: 5, // in minutes
    foodType: "veg",
    isBestseller: true,
    isAvailable: true,
    order: 1,
    image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "item-ginger-tea",
    restaurantId: "naachi-cafe",
    categoryId: "cat-tea-coffee",
    name: "Ginger Tea",
    description: "Freshly crushed ginger infused milk tea with soothing aroma and warming taste.",
    price: 15,
    prepTime: 5,
    foodType: "veg",
    isBestseller: false,
    isAvailable: true,
    order: 2,
    image: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "item-lemon-tea",
    restaurantId: "naachi-cafe",
    categoryId: "cat-tea-coffee",
    name: "Lemon Tea",
    description: "Zesty invigorating black tea infused with freshly squeezed lemon juice and mint.",
    price: 15,
    prepTime: 5,
    foodType: "veg",
    isBestseller: false,
    isAvailable: true,
    order: 3,
    image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "item-coffee",
    restaurantId: "naachi-cafe",
    categoryId: "cat-tea-coffee",
    name: "Coffee",
    description: "Authentic South Indian degree filter coffee decoction with frothy hot milk.",
    price: 20,
    prepTime: 5,
    foodType: "veg",
    isBestseller: true,
    isAvailable: true,
    order: 4,
    image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "item-black-tea",
    restaurantId: "naachi-cafe",
    categoryId: "cat-tea-coffee",
    name: "Black Tea",
    description: "Strong robust Assam tea leaves brewed dark without milk for pure tea essence.",
    price: 12,
    prepTime: 5,
    foodType: "veg",
    isBestseller: false,
    isAvailable: true,
    order: 5,
    image: "https://images.unsplash.com/photo-1594631252845-29fc4cc8cde9?auto=format&fit=crop&w=600&q=80"
  },

  // Fresh Juice
  {
    id: "item-lemon-juice",
    restaurantId: "naachi-cafe",
    categoryId: "cat-juice",
    name: "Lemon Juice",
    description: "Chilled sweet and salted freshly squeezed nimbu pani with rock salt and cumin hint.",
    price: 25,
    prepTime: 7,
    foodType: "veg",
    isBestseller: false,
    isAvailable: true,
    order: 6,
    image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "item-watermelon-juice",
    restaurantId: "naachi-cafe",
    categoryId: "cat-juice",
    name: "Watermelon Juice",
    description: "100% pure cold-pressed natural watermelon juice served refreshingly chilled.",
    price: 40,
    prepTime: 8,
    foodType: "veg",
    isBestseller: true,
    isAvailable: true,
    order: 7,
    image: "https://images.unsplash.com/photo-1589733955941-5eeaf752f6dd?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "item-orange-juice",
    restaurantId: "naachi-cafe",
    categoryId: "cat-juice",
    name: "Orange Juice",
    description: "Fresh Nagpur oranges squeezed on order, rich in vitamin C with sweet citrus tang.",
    price: 50,
    prepTime: 8,
    foodType: "veg",
    isBestseller: false,
    isAvailable: true,
    order: 8,
    image: "https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "item-apple-juice",
    restaurantId: "naachi-cafe",
    categoryId: "cat-juice",
    name: "Apple Juice",
    description: "Crisp Kashmiri red apples blended fresh with a pinch of cinnamon.",
    price: 60,
    prepTime: 8,
    foodType: "veg",
    isBestseller: false,
    isAvailable: true,
    order: 9,
    image: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=600&q=80"
  },

  // Snacks
  {
    id: "item-samosa",
    restaurantId: "naachi-cafe",
    categoryId: "cat-snacks",
    name: "Samosa",
    description: "Crispy flaky golden pastry stuffed with spicy mashed potatoes, green peas and herbs.",
    price: 15,
    prepTime: 10,
    foodType: "veg",
    isBestseller: true,
    isAvailable: true,
    order: 10,
    image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "item-veg-puff",
    restaurantId: "naachi-cafe",
    categoryId: "cat-snacks",
    name: "Veg Puff",
    description: "Multi-layered bakery crust stuffed with spiced carrot, potato, and cabbage masala.",
    price: 20,
    prepTime: 8,
    foodType: "veg",
    isBestseller: false,
    isAvailable: true,
    order: 11,
    image: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "item-egg-puff",
    restaurantId: "naachi-cafe",
    categoryId: "cat-snacks",
    name: "Egg Puff",
    description: "Crispy baked puff pastry stuffed with hard-boiled egg seasoned with caramelized onion masala.",
    price: 25,
    prepTime: 8,
    foodType: "non-veg",
    isBestseller: false,
    isAvailable: true,
    order: 12,
    image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80"
  },

  // Mains & Biriyani
  {
    id: "item-chicken-biriyani",
    restaurantId: "naachi-cafe",
    categoryId: "cat-mains",
    name: "Chicken Biriyani",
    description: "Aromatic basmati rice cooked with tender chicken pieces, saffron, mint and authentic dum spices.",
    price: 180,
    prepTime: 15,
    foodType: "non-veg",
    isBestseller: true,
    isAvailable: true,
    order: 13,
    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "item-veg-biriyani",
    restaurantId: "naachi-cafe",
    categoryId: "cat-mains",
    name: "Veg Dum Biriyani",
    description: "Fragrant long-grain basmati rice layered with mixed farm vegetables, paneer and royal spices.",
    price: 140,
    prepTime: 15,
    foodType: "veg",
    isBestseller: false,
    isAvailable: true,
    order: 14,
    image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80"
  },

  // Desserts
  {
    id: "item-gulab-jamun",
    restaurantId: "naachi-cafe",
    categoryId: "cat-desserts",
    name: "Gulab Jamun (2 pcs)",
    description: "Soft melt-in-mouth golden milk dough balls soaked in warm rose and cardamom syrup.",
    price: 40,
    prepTime: 4,
    foodType: "veg",
    isBestseller: true,
    isAvailable: true,
    order: 15,
    image: "https://images.unsplash.com/photo-1605197584547-c93de1a02937?auto=format&fit=crop&w=600&q=80"
  }
];

export const DEMO_TABLES = [
  { id: "T01", restaurantId: "naachi-cafe", tableNumber: "1", name: "Table 1", capacity: 2, isActive: true, status: "available" },
  { id: "T02", restaurantId: "naachi-cafe", tableNumber: "2", name: "Table 2", capacity: 4, isActive: true, status: "available" },
  { id: "T03", restaurantId: "naachi-cafe", tableNumber: "3", name: "Table 3", capacity: 4, isActive: true, status: "available" },
  { id: "T04", restaurantId: "naachi-cafe", tableNumber: "4", name: "Table 4", capacity: 6, isActive: true, status: "available" },
  { id: "T05", restaurantId: "naachi-cafe", tableNumber: "5", name: "Table 5", capacity: 2, isActive: true, status: "available" },
  { id: "T06", restaurantId: "naachi-cafe", tableNumber: "6", name: "Table 6", capacity: 8, isActive: true, status: "available" },
];

export const DEMO_ORDERS = [];
