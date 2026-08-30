export interface BilingualText {
  en: string;
  ar: string;
}

export interface User {
  id: string;
  email: string;
  restaurantId: string;
}

export interface Branding {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  buttonColor: string;
  textColor: string;
  fontFamily: string;
}

export interface Restaurant {
  id: string;
  name: BilingualText;
  description: BilingualText;
  phone: string;
  address: BilingualText;
  googleMapsLink: string;
  openingHours: BilingualText;
  instagram: string;
  facebook: string;
  whatsAppNumber: string;
  logoUrl: string;
  heroImageUrl: string;
  pricingPlan: 'website' | 'orders' | 'integrated';
  domain: string;
  published: boolean;
  templateId: 'modern' | 'luxury' | 'minimal' | 'fastfood';
  branding: Branding;
}

export interface MenuItemOption {
  name: BilingualText;
  priceModifier: number;
}

export interface MenuItemVariant {
  name: BilingualText; // e.g. "Size" or "الحجم"
  options: MenuItemOption[];
}

export interface MenuItemAddon {
  name: BilingualText;
  price: number;
}

export interface MenuItem {
  id: string;
  name: BilingualText;
  description: BilingualText;
  price: number;
  imageUrl: string;
  isAvailable: boolean;
  isHidden: boolean;
  variants: MenuItemVariant[];
  addons: MenuItemAddon[];
  order: number;
}

export interface MenuCategory {
  id: string;
  name: BilingualText;
  order: number;
  items: MenuItem[];
}

export interface Menu {
  restaurantId: string;
  categories: MenuCategory[];
}

// ── Offers / Specials ──────────────────────────────────────────────────────
export interface OfferChoiceItem {
  menuItemId: string; // references MenuItem.id
  name: BilingualText;
  imageUrl?: string;
  priceModifier: number; // extra cost if chosen (0 = included in deal)
}

export interface OfferChoice {
  id: string;
  label: BilingualText; // e.g. "Choose your burger"
  items: OfferChoiceItem[];
  minSelect: number;
  maxSelect: number;
}

export interface Offer {
  id: string;
  title: BilingualText;
  description: BilingualText;
  badge: string; // emoji + text e.g. "🔥 Best Deal"
  imageUrl: string;
  dealPrice: number;
  originalPrice: number;
  choices: OfferChoice[];
  isActive: boolean;
}
// ──────────────────────────────────────────────────────────────────────────

export interface OrderItem {
  itemId: string;
  name: BilingualText;
  quantity: number;
  price: number; // calculated final price per unit
  selectedVariants: Array<{ name: BilingualText; optionName: BilingualText; priceModifier: number }>;
  selectedAddons: Array<{ name: BilingualText; price: number }>;
}

export interface Order {
  id: string;
  restaurantId: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  orderType: 'pickup' | 'delivery';
  notes: string;
  status: 'pending' | 'preparing' | 'completed' | 'cancelled';
  items: OrderItem[];
  totalPrice: number;
  createdAt: string;
}

export interface DatabaseSchema {
  users: Record<string, User>;
  restaurants: Record<string, Restaurant>;
  menus: Record<string, Menu>;
  orders: Record<string, Order[]>;
  offers: Record<string, Offer[]>; // keyed by restaurantId
}

const DEFAULT_REST_ID_1 = '001';
const DEFAULT_REST_ID_2 = '002';

const SEED_DATA: DatabaseSchema = {
  users: {
    'owner@bistroflow.com': {
      id: 'usr_1',
      email: 'owner@bistroflow.com',
      restaurantId: DEFAULT_REST_ID_1,
    },
    'burger@bistroflow.com': {
      id: 'usr_2',
      email: 'burger@bistroflow.com',
      restaurantId: DEFAULT_REST_ID_2,
    }
  },
  restaurants: {
    [DEFAULT_REST_ID_1]: {
      id: DEFAULT_REST_ID_1,
      name: {
        en: 'Bella Italia',
        ar: 'بيلا إيطاليا'
      },
      description: {
        en: 'Authentic stone-baked neapolitan pizzas and fresh homemade pasta in the heart of Cairo.',
        ar: 'بيتزا نابولي أصيلة مخبوزة على الحجر وباستا طازجة محلية الصنع في قلب القاهرة.'
      },
      phone: '+20 100 123 4567',
      address: {
        en: '9 El-Maadi St, Cairo, Egypt',
        ar: '٩ شارع المعادي، القاهرة، مصر'
      },
      googleMapsLink: 'https://maps.google.com',
      openingHours: {
        en: 'Everyday: 12:00 PM - 12:00 AM',
        ar: 'يومياً: ١٢:٠٠ م - ١٢:٠٠ ص'
      },
      instagram: 'bellaitalia_cairo',
      facebook: 'bellaitalia.cairo',
      whatsAppNumber: '201001234567',
      logoUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=120&auto=format&fit=crop&q=60',
      heroImageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1200&auto=format&fit=crop&q=80',
      pricingPlan: 'orders',
      domain: 'bellaitalia.bistroflow.com',
      published: true,
      templateId: 'luxury',
      branding: {
        primaryColor: '#b91c1c',
        secondaryColor: '#15803d',
        backgroundColor: '#fafaf9',
        buttonColor: '#b91c1c',
        textColor: '#1c1917',
        fontFamily: 'Playfair Display, Cairo'
      }
    },
    [DEFAULT_REST_ID_2]: {
      id: DEFAULT_REST_ID_2,
      name: {
        en: 'Burger Loft',
        ar: 'لوفت برجر'
      },
      description: {
        en: 'Gourmet smashed beef burgers, hand-cut fries, and thick premium milkshakes.',
        ar: 'برجر لحم بقري سماش فاخر، بطاطس مقلية مقطعة يدوياً، وميلك شيك سميك ومميز.'
      },
      phone: '+20 111 987 6543',
      address: {
        en: '42 El-Tahrir Sq, Heliopolis, Cairo',
        ar: '٤٢ ميدان التحرير، مصر الجديدة، القاهرة'
      },
      googleMapsLink: 'https://maps.google.com',
      openingHours: {
        en: 'Everyday: 1:00 PM - 2:00 AM',
        ar: 'يومياً: ١:٠٠ م - ٢:٠٠ ص'
      },
      instagram: 'burgerloft_eg',
      facebook: 'burgerloft.eg',
      whatsAppNumber: '201119876543',
      logoUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=120&auto=format&fit=crop&q=60',
      heroImageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200&auto=format&fit=crop&q=80',
      pricingPlan: 'website',
      domain: 'burgerloft.bistroflow.com',
      published: true,
      templateId: 'fastfood',
      branding: {
        primaryColor: '#f59e0b',
        secondaryColor: '#1e293b',
        backgroundColor: '#fffbeb',
        buttonColor: '#f59e0b',
        textColor: '#0f172a',
        fontFamily: 'Outfit, Cairo'
      }
    }
  },
  menus: {
    [DEFAULT_REST_ID_1]: {
      restaurantId: DEFAULT_REST_ID_1,
      categories: [
        {
          id: 'cat_combos',
          name: { en: '🔥 Combos & Family Boxes', ar: '🔥 عروض الوجبات والعائلات' },
          order: 1,
          items: [
            {
              id: 'item_c1',
              name: { en: 'Bazooka Mega Feast Box', ar: 'باكورة بوكس العائلة الفاخر' },
              description: { en: '2 Large Pizzas + 10 Crispy Tenders + Large Cheesy Fries + 1.5L Pepsi.', ar: '٢ بيتزا حجم كبير + ١٠ قطع دجاج كريسبي + بطاطس بالجبنة + بيبسي ١.٥ لتر.' },
              price: 490,
              imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&auto=format&fit=crop&q=80',
              isAvailable: true,
              isHidden: false,
              variants: [],
              addons: [],
              order: 1
            },
            {
              id: 'item_c2',
              name: { en: 'Duo Pizza & Wings Combo', ar: 'عرض البيتزا والمايتي أجنحة' },
              description: { en: 'Medium Pizza + 8 BBQ Glazed Wings + Garlic Dip + 2 Drinks.', ar: 'بيتزا وسط + ٨ قطع أجنحة بالباربكيو + ثومية + ٢ مشروب.' },
              price: 340,
              imageUrl: 'https://images.unsplash.com/photo-1541745537411-b8046dc6d66c?w=400&auto=format&fit=crop&q=80',
              isAvailable: true,
              isHidden: false,
              variants: [],
              addons: [],
              order: 2
            }
          ]
        },
        {
          id: 'cat_1_1',
          name: { en: '🍕 Wood-Fired Pizzas', ar: '🍕 بيتزا نابولي الإيطالية' },
          order: 2,
          items: [
            {
              id: 'item_1_1_1',
              name: { en: 'Margherita DOC', ar: 'مارجريتا دي أو سي' },
              description: { en: 'San Marzano tomatoes, fresh buffalo mozzarella, fresh basil, extra virgin olive oil.', ar: 'طماطم سان مارزانو، موزاريلا بوفالو طازجة، ريحان طازج، وزيت زيتون بكر ممتاز.' },
              price: 180,
              imageUrl: 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=400&auto=format&fit=crop&q=80',
              isAvailable: true,
              isHidden: false,
              variants: [
                {
                  name: { en: 'Size', ar: 'الحجم' },
                  options: [
                    { name: { en: 'Regular 28cm', ar: 'وسط ٢٨ سم' }, priceModifier: 0 },
                    { name: { en: 'Large 33cm', ar: 'كبير ٣٣ سم' }, priceModifier: 60 }
                  ]
                }
              ],
              addons: [
                { name: { en: 'Extra Mozzarella', ar: 'جبنة موزاريلا إضافية' }, price: 40 }
              ],
              order: 1
            },
            {
              id: 'item_1_1_2',
              name: { en: 'Spicy Diavola Pepperoni', ar: 'ديافولا ببروني حارة' },
              description: { en: 'Spicy Italian salami, nduja, mozzarella, and chili-infused honey drizzle.', ar: 'سلامي إيطالي حار، إندوجا، موزاريلا، وعسل بنكهة الفلفل الحار.' },
              price: 230,
              imageUrl: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=400&auto=format&fit=crop&q=80',
              isAvailable: true,
              isHidden: false,
              variants: [],
              addons: [],
              order: 2
            },
            {
              id: 'item_1_1_3',
              name: { en: 'Quattro Formaggi Supreme', ar: 'كواترو فورماجي ٤ أجبان' },
              description: { en: 'Gorgonzola, smoked provolone, mozzarella, parmigiano reggiano.', ar: 'جبن جورجونزولا، بروفولون مدخن، موزاريلا، وبارميجانو ريجانو.' },
              price: 250,
              imageUrl: 'https://images.unsplash.com/photo-1573821663912-569905455b1c?w=400&auto=format&fit=crop&q=80',
              isAvailable: true,
              isHidden: false,
              variants: [],
              addons: [],
              order: 3
            }
          ]
        },
        {
          id: 'cat_burgers',
          name: { en: '🍔 Gourmet Burgers', ar: '🍔 برجر السماش الفاخر' },
          order: 3,
          items: [
            {
              id: 'item_b1',
              name: { en: 'Double Cheese Smash', ar: 'دبل تشيز سماش' },
              description: { en: 'Two 100g smash beef patties, double melted cheddar, grilled onions, secret sauce.', ar: 'شريحتا لحم بقري سماش، شيدر ذائبة، بصل مكرمل، وسس بيك نوتس الخاص.' },
              price: 195,
              imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&auto=format&fit=crop&q=80',
              isAvailable: true,
              isHidden: false,
              variants: [],
              addons: [{ name: { en: 'Crispy Bacon', ar: 'باكون مقدد' }, price: 35 }],
              order: 1
            },
            {
              id: 'item_b2',
              name: { en: 'Truffle Mushroom Angus', ar: 'ترافل ماشروم أنجوس' },
              description: { en: 'Angus beef patty, black truffle mayo, sauteed wild mushrooms, Swiss cheese.', ar: 'لحم أنجوس فاخر، مايو الترافل الأسود، فطر سوتيه، وجبنة سويسرية.' },
              price: 240,
              imageUrl: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=400&auto=format&fit=crop&q=80',
              isAvailable: true,
              isHidden: false,
              variants: [],
              addons: [],
              order: 2
            },
            {
              id: 'item_b3',
              name: { en: 'Crispy Ranch Chicken', ar: 'كريسبي رانش دجاج' },
              description: { en: 'Golden fried chicken breast, creamy ranch, iceberg lettuce, dill pickles.', ar: 'صدر دجاج مقلي مقرمش، صوص رانش كريمي، خس طازج، ومخلل.' },
              price: 175,
              imageUrl: 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=400&auto=format&fit=crop&q=80',
              isAvailable: true,
              isHidden: false,
              variants: [],
              addons: [],
              order: 3
            }
          ]
        },
        {
          id: 'cat_sides',
          name: { en: '🍟 Starters & Sides', ar: '🍟 المقرمشات والمقبلات' },
          order: 4,
          items: [
            {
              id: 'item_s1',
              name: { en: 'Cheesy Bacon Loaded Fries', ar: 'بطاطس لودد بالجبنة والباكون' },
              description: { en: 'Hand-cut skin-on fries, warm cheddar cheese sauce, crispy bacon bits, jalapeños.', ar: 'بطاطس مقلية مقرمشة، صوص جبنة شيدر ساخن، قطع باكون، وهالبينو.' },
              price: 95,
              imageUrl: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=400&auto=format&fit=crop&q=80',
              isAvailable: true,
              isHidden: false,
              variants: [],
              addons: [],
              order: 1
            },
            {
              id: 'item_s2',
              name: { en: 'Golden Mozzarella Sticks (5pcs)', ar: 'أصابع موزاريلا ذهبية (٥ قطع)' },
              description: { en: 'Panko crusted mozzarella sticks served with warm marinara dipping sauce.', ar: 'أصابع موزاريلا مغطاة ببانكو مقرمش تقدم مع صوص المارينارا.' },
              price: 85,
              imageUrl: 'https://images.unsplash.com/photo-1531749668029-2db88e4276c7?w=400&auto=format&fit=crop&q=80',
              isAvailable: true,
              isHidden: false,
              variants: [],
              addons: [],
              order: 2
            },
            {
              id: 'item_s3',
              name: { en: 'Crispy Beer-Battered Onion Rings', ar: 'حلقات بصل مقرمشة' },
              description: { en: 'Thick sliced sweet onions in crispy batter served with smoked BBQ dip.', ar: 'حلقات بصل سميكة ومقرمشة تقدم مع صوص باربكيو مدخن.' },
              price: 70,
              imageUrl: 'https://images.unsplash.com/photo-1639024471283-03518883512d?w=400&auto=format&fit=crop&q=80',
              isAvailable: true,
              isHidden: false,
              variants: [],
              addons: [],
              order: 3
            }
          ]
        },
        {
          id: 'cat_drinks',
          name: { en: '🥤 Drinks & Shakes', ar: '🥤 المشروبات والميلك شيك' },
          order: 5,
          items: [
            {
              id: 'item_d1',
              name: { en: 'Thick Salted Caramel Shake', ar: 'ميلك شيك سولتد كراميل' },
              description: { en: 'Vanilla bean ice cream blended with homemade salted caramel and whipped cream.', ar: 'آيس كريم فانيليا ممزوج بكراميل مالح وكريمة خفق.' },
              price: 90,
              imageUrl: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&auto=format&fit=crop&q=80',
              isAvailable: true,
              isHidden: false,
              variants: [],
              addons: [],
              order: 1
            },
            {
              id: 'item_d2',
              name: { en: 'Fresh Passionfruit Mojito', ar: 'موهيتو باشن فروت طازج' },
              description: { en: 'Fresh mint leaves, crushed lime, passionfruit puree, sparkling soda.', ar: 'نعناع طازج، ليمون، بيوريه باشن فروت، وصودا فوارة.' },
              price: 75,
              imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400&auto=format&fit=crop&q=80',
              isAvailable: true,
              isHidden: false,
              variants: [],
              addons: [],
              order: 2
            },
            {
              id: 'item_d3',
              name: { en: 'Coca-Cola Cold Can (330ml)', ar: 'كوكاكولا كانز بارد (٣٣٠ مل)' },
              description: { en: 'Ice cold refreshing original taste cola.', ar: 'كوكاكولا مثلجة بالثعم الأصلي المنعش.' },
              price: 25,
              imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&auto=format&fit=crop&q=80',
              isAvailable: true,
              isHidden: false,
              variants: [],
              addons: [],
              order: 3
            }
          ]
        },
        {
          id: 'cat_desserts',
          name: { en: '🍰 Desserts & Sweets', ar: '🍰 الحلويات والحلويات الغربية' },
          order: 6,
          items: [
            {
              id: 'item_ds1',
              name: { en: 'Hot Fudge Chocolate Lava Cake', ar: 'مولتن كيك الشوكولاتة الساخنة' },
              description: { en: 'Warm chocolate cake with a molten center served with vanilla gelato.', ar: 'كيك شوكولاتة ساخن بقالب فادج محشو بآيس كريم فانيليا.' },
              price: 110,
              imageUrl: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&auto=format&fit=crop&q=80',
              isAvailable: true,
              isHidden: false,
              variants: [],
              addons: [],
              order: 1
            }
          ]
        }
      ]
    },
    [DEFAULT_REST_ID_2]: {
      restaurantId: DEFAULT_REST_ID_2,
      categories: [
        {
          id: 'cat_2_1',
          name: { en: 'Smashed Burgers', ar: 'برجر سماش' },
          order: 1,
          items: [
            {
              id: 'item_2_1_1',
              name: { en: 'Double Cheese Smash', ar: 'دبل تشيز سماش' },
              description: {
                en: 'Two 100g beef patties, double American cheese, pickles, and our signature burger sauce.',
                ar: 'شريحتا لحم بقري ١٠٠ جرام، جبنة أمريكية مزدوجة، مخلل، وصلصة البرجر المميزة الخاصة بنا.'
              },
              price: 160,
              imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&auto=format&fit=crop&q=80',
              isAvailable: true,
              isHidden: false,
              variants: [
                {
                  name: { en: 'Beef Style', ar: 'نوع اللحم' },
                  options: [
                    { name: { en: 'Local Egyptian Beef', ar: 'بلدي بلدي' }, priceModifier: 0 },
                    { name: { en: 'Angus Beef Premium', ar: 'لحم أنجوس فاخر' }, priceModifier: 50 }
                  ]
                }
              ],
              addons: [
                { name: { en: 'Crispy Beef Bacon', ar: 'لحم بقري مقدد مقرمش' }, price: 30 },
                { name: { en: 'Fried Egg', ar: 'بيض مقلي' }, price: 15 }
              ],
              order: 1
            }
          ]
        }
      ]
    }
  },
  orders: {
    [DEFAULT_REST_ID_1]: [
      {
        id: 'ord_1',
        restaurantId: DEFAULT_REST_ID_1,
        customerName: 'Ahmed Aly',
        customerPhone: '+20 100 444 5555',
        customerAddress: 'Apartment 4, 3rd Floor, Building 12, Street 15, Maadi',
        orderType: 'delivery',
        notes: 'Please bring change for 500 EGP. Deliver as soon as possible.',
        status: 'pending',
        items: [
          {
            itemId: 'item_1_1_1',
            name: { en: 'Margherita DOC', ar: 'مارجريتا دي أو سي' },
            quantity: 2,
            price: 180,
            selectedVariants: [{ name: { en: 'Size', ar: 'الحجم' }, optionName: { en: 'Regular 28cm', ar: 'وسط ٢٨ سم' }, priceModifier: 0 }],
            selectedAddons: []
          }
        ],
        totalPrice: 360,
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString()
      }
    ],
    [DEFAULT_REST_ID_2]: []
  },
  offers: {
    [DEFAULT_REST_ID_1]: [
      {
        id: 'offer_1_1',
        title: { en: 'Date Night for Two 🍕', ar: 'عشاء رومانسي لشخصين 🍕' },
        description: {
          en: 'Two wood-fired pizzas + a shared tiramisu — perfect for a special night.',
          ar: 'بيتزتان نابوليتان + تيراميسو مشترك — مثالي لسهرة مميزة.'
        },
        badge: '❤️ Couples Deal',
        imageUrl: 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=600&auto=format&fit=crop&q=80',
        dealPrice: 340,
        originalPrice: 420,
        isActive: true,
        choices: [
          {
            id: 'ch_1_1_1',
            label: { en: 'First Pizza', ar: 'البيتزا الأولى' },
            minSelect: 1,
            maxSelect: 1,
            items: [
              { menuItemId: 'item_1_1_1', name: { en: 'Margherita DOC', ar: 'مارجريتا دي أو سي' }, imageUrl: 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=200&auto=format&fit=crop&q=60', priceModifier: 0 },
              { menuItemId: 'item_1_1_2', name: { en: 'Spicy Diavola', ar: 'ديافولا حارة' }, imageUrl: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=200&auto=format&fit=crop&q=60', priceModifier: 0 }
            ]
          },
          {
            id: 'ch_1_1_2',
            label: { en: 'Second Pizza', ar: 'البيتزا الثانية' },
            minSelect: 1,
            maxSelect: 1,
            items: [
              { menuItemId: 'item_1_1_1', name: { en: 'Margherita DOC', ar: 'مارجريتا دي أو سي' }, imageUrl: 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=200&auto=format&fit=crop&q=60', priceModifier: 0 },
              { menuItemId: 'item_1_1_2', name: { en: 'Spicy Diavola', ar: 'ديافولا حارة' }, imageUrl: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=200&auto=format&fit=crop&q=60', priceModifier: 0 }
            ]
          }
        ]
      }
    ],
    [DEFAULT_REST_ID_2]: [
      {
        id: 'offer_2_1',
        title: { en: 'Smash Combo Meal', ar: 'وجبة سماش الكاملة' },
        description: {
          en: 'Your choice of burger + hand-cut fries + a fountain drink. The ultimate combo.',
          ar: 'برجر من اختيارك + بطاطس مقلية يدوياً + مشروب غازي. الوجبة المثالية.'
        },
        badge: '🔥 Best Value',
        imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80',
        dealPrice: 210,
        originalPrice: 265,
        isActive: true,
        choices: [
          {
            id: 'ch_2_1_1',
            label: { en: 'Choose Your Burger', ar: 'اختر برجرك' },
            minSelect: 1,
            maxSelect: 1,
            items: [
              { menuItemId: 'item_2_1_1', name: { en: 'Double Cheese Smash', ar: 'دبل تشيز سماش' }, imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&auto=format&fit=crop&q=60', priceModifier: 0 }
            ]
          },
          {
            id: 'ch_2_1_2',
            label: { en: 'Choose Your Drink', ar: 'اختر مشروبك' },
            minSelect: 1,
            maxSelect: 1,
            items: [
              { menuItemId: '', name: { en: 'Coca-Cola', ar: 'كوكا كولا' }, priceModifier: 0 },
              { menuItemId: '', name: { en: 'Pepsi', ar: 'بيبسي' }, priceModifier: 0 },
              { menuItemId: '', name: { en: 'Sprite', ar: 'سبرايت' }, priceModifier: 0 }
            ]
          }
        ]
      }
    ]
  }
};

class MockDatabase {
  private db: DatabaseSchema;

  constructor() {
    const stored = localStorage.getItem('bistroflow_db');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Migrate: add offers if missing from stored DB
        if (!parsed.offers) parsed.offers = SEED_DATA.offers;
        // Migrate legacy pricing plan names
        if (parsed.restaurants) {
          Object.values(parsed.restaurants).forEach((r: any) => {
            if (r.pricingPlan === 'starter') r.pricingPlan = 'website';
            if (r.pricingPlan === 'professional') r.pricingPlan = 'orders';
          });
        }
        this.db = parsed;
      } catch (e) {
        this.db = SEED_DATA;
        this.save();
      }
    } else {
      this.db = SEED_DATA;
      this.save();
    }
  }

  private save() {
    localStorage.setItem('bistroflow_db', JSON.stringify(this.db));
  }

  // Users / Auth
  login(email: string): User | null {
    const user = this.db.users[email.toLowerCase().trim()];
    if (user) {
      localStorage.setItem('bistroflow_user', JSON.stringify({
        email: user.email,
        restaurantId: user.restaurantId,
      }));
    }
    return user || null;
  }

  register(email: string, restaurantName: BilingualText): { user: User; restaurant: Restaurant } {
    const normalizedEmail = email.toLowerCase().trim();
    if (this.db.users[normalizedEmail]) {
      throw new Error('User already exists');
    }

    const restId = `rest_${Math.random().toString(36).substr(2, 9)}`;
    const userId = `usr_${Math.random().toString(36).substr(2, 9)}`;

    const newRestaurant: Restaurant = {
      id: restId,
      name: restaurantName,
      description: {
        en: 'A wonderful dining experience with fresh quality ingredients.',
        ar: 'تجربة تناول طعام رائعة بمكونات طازجة وجودة عالية.'
      },
      phone: '',
      address: {
        en: '',
        ar: ''
      },
      googleMapsLink: '',
      openingHours: {
        en: 'Monday - Sunday: 12:00 PM - 11:00 PM',
        ar: 'الإثنين - الأحد: ١٢:٠٠ م - ١١:٠٠ م'
      },
      instagram: '',
      facebook: '',
      whatsAppNumber: '',
      logoUrl: '',
      heroImageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&auto=format&fit=crop&q=80',
      pricingPlan: 'website',
      domain: `${restaurantName.en.toLowerCase().replace(/[^a-z0-9]/g, '') || restId}.bistroflow.com`,
      published: false,
      templateId: 'modern',
      branding: {
        primaryColor: '#3b82f6',
        secondaryColor: '#1e293b',
        backgroundColor: '#ffffff',
        buttonColor: '#3b82f6',
        textColor: '#0f172a',
        fontFamily: 'Outfit, Cairo'
      }
    };

    const newUser: User = {
      id: userId,
      email: normalizedEmail,
      restaurantId: restId,
    };

    this.db.users[normalizedEmail] = newUser;
    this.db.restaurants[restId] = newRestaurant;
    this.db.menus[restId] = {
      restaurantId: restId,
      categories: []
    };
    this.db.orders[restId] = [];

    this.save();
    localStorage.setItem('bistroflow_user', JSON.stringify({
      email: newUser.email,
      restaurantId: newUser.restaurantId,
    }));
    return { user: newUser, restaurant: newRestaurant };
  }

  // Restaurant Config
  getRestaurant(id: string): Restaurant | null {
    return this.db.restaurants[id] || null;
  }

  getRestaurantByDomain(domain: string): Restaurant | null {
    const restaurant = Object.values(this.db.restaurants).find(
      (r) => r.domain.toLowerCase() === domain.toLowerCase() || r.id === domain
    );
    return restaurant || null;
  }

  updateRestaurant(id: string, updates: Partial<Restaurant>) {
    if (!this.db.restaurants[id]) throw new Error('Restaurant not found');
    this.db.restaurants[id] = {
      ...this.db.restaurants[id],
      ...updates,
      branding: {
        ...this.db.restaurants[id].branding,
        ...(updates.branding || {})
      }
    };
    this.save();
    return this.db.restaurants[id];
  }

  // Menus
  getMenu(restaurantId: string): Menu {
    if (!this.db.menus[restaurantId]) {
      this.db.menus[restaurantId] = {
        restaurantId,
        categories: []
      };
      this.save();
    }
    return this.db.menus[restaurantId];
  }

  updateMenu(restaurantId: string, menu: Menu) {
    this.db.menus[restaurantId] = menu;
    this.save();
    return this.db.menus[restaurantId];
  }

  // Orders
  getOrders(restaurantId: string): Order[] {
    return this.db.orders[restaurantId] || [];
  }

  createOrder(restaurantId: string, orderData: Omit<Order, 'id' | 'restaurantId' | 'status' | 'createdAt'>): Order {
    const orderId = `ord_${Math.random().toString(36).substr(2, 9)}`;
    const newOrder: Order = {
      ...orderData,
      id: orderId,
      restaurantId,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    if (!this.db.orders[restaurantId]) {
      this.db.orders[restaurantId] = [];
    }
    this.db.orders[restaurantId].push(newOrder);
    this.save();
    return newOrder;
  }

  updateOrderStatus(restaurantId: string, orderId: string, status: Order['status']): Order {
    const restaurantOrders = this.db.orders[restaurantId] || [];
    const idx = restaurantOrders.findIndex((o) => o.id === orderId);
    if (idx === -1) throw new Error('Order not found');
    restaurantOrders[idx].status = status;
    this.save();
    return restaurantOrders[idx];
  }

  // Offers / Specials
  getOffers(restaurantId: string): Offer[] {
    if (!this.db.offers) this.db.offers = {};
    return this.db.offers[restaurantId] || [];
  }

  createOffer(restaurantId: string, offer: Omit<Offer, 'id'>): Offer {
    if (!this.db.offers) this.db.offers = {};
    if (!this.db.offers[restaurantId]) this.db.offers[restaurantId] = [];
    const newOffer: Offer = {
      ...offer,
      id: `offer_${Math.random().toString(36).substr(2, 9)}`
    };
    this.db.offers[restaurantId].push(newOffer);
    this.save();
    return newOffer;
  }

  updateOffer(restaurantId: string, offerId: string, updates: Partial<Offer>) {
    if (!this.db.offers?.[restaurantId]) throw new Error('Offers not found');
    const idx = this.db.offers[restaurantId].findIndex(o => o.id === offerId);
    if (idx === -1) throw new Error('Offer not found');
    this.db.offers[restaurantId][idx] = { ...this.db.offers[restaurantId][idx], ...updates };
    this.save();
    return this.db.offers[restaurantId][idx];
  }

  deleteOffer(restaurantId: string, offerId: string) {
    if (!this.db.offers?.[restaurantId]) return;
    this.db.offers[restaurantId] = this.db.offers[restaurantId].filter(o => o.id !== offerId);
    this.save();
  }

  simulateMenuExtraction(fileType: 'pdf' | 'csv' | 'image', _fileName: string): MenuCategory[] {
    // Generate menu categories and items based on fileType and standard names
    if (fileType === 'pdf') {
      return [
        {
          id: 'ext_cat_1',
          name: { en: 'Appetizers & Starters', ar: 'المقبلات والشوربة' },
          order: 1,
          items: [
            {
              id: 'ext_item_1_1',
              name: { en: 'Garlic Bread Mozzarella', ar: 'خبز بالثوم والموزاريلا' },
              description: {
                en: 'Toasted baguette slices with garlic butter, herbs, and melted mozzarella cheese.',
                ar: 'شرائح باجيت محمصة مع زبدة الثوم والأعشاب وجبنة الموزاريلا الذائبة.'
              },
              price: 90,
              imageUrl: 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=400&auto=format&fit=crop&q=80',
              isAvailable: true,
              isHidden: false,
              variants: [],
              addons: [],
              order: 1
            },
            {
              id: 'ext_item_1_2',
              name: { en: 'Crispy Calamari', ar: 'كالاماري مقرمش' },
              description: {
                en: 'Deep-fried golden squid rings served with dynamic garlic aioli sauce.',
                ar: 'حلقات الحبار الذهبية المقلية تقدم مع صلصة المايونيز بالثوم.'
              },
              price: 150,
              imageUrl: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&auto=format&fit=crop&q=80',
              isAvailable: true,
              isHidden: false,
              variants: [],
              addons: [],
              order: 2
            }
          ]
        },
        {
          id: 'ext_cat_2',
          name: { en: 'Main Italian Specialties', ar: 'الأطباق الإيطالية الرئيسية' },
          order: 2,
          items: [
            {
              id: 'ext_item_2_1',
              name: { en: 'Penne Arrabiata', ar: 'بيني أرابياتا' },
              description: {
                en: 'Penne pasta tossed in spicy tomato garlic sauce, fresh parsley, and extra parmesan.',
                ar: 'مكرونة بيني مطبوخة في صلصة طماطم حارة بالثوم، بقدونس طازج وجبنة بارميزان إضافية.'
              },
              price: 140,
              imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&auto=format&fit=crop&q=80',
              isAvailable: true,
              isHidden: false,
              variants: [],
              addons: [
                { name: { en: 'Add Grilled Shrimp', ar: 'إضافة جمبري مشوي' }, price: 80 }
              ],
              order: 1
            },
            {
              id: 'ext_item_2_2',
              name: { en: 'Chicken Parmigiana', ar: 'دجاج بارميجانا' },
              description: {
                en: 'Breaded chicken breast baked with rich marinara sauce and fresh mozzarella, served with spaghetti.',
                ar: 'صدر دجاج مغطى بالبقسماط ومخبوز مع صلصة المارينارا الغنية والموزاريلا الطازجة، يقدم مع السباغيتي.'
              },
              price: 240,
              imageUrl: 'https://images.unsplash.com/photo-1632778149955-e80f8ceca218?w=400&auto=format&fit=crop&q=80',
              isAvailable: true,
              isHidden: false,
              variants: [],
              addons: [],
              order: 2
            }
          ]
        }
      ];
    } else if (fileType === 'csv') {
      return [
        {
          id: 'ext_cat_1',
          name: { en: 'Gourmet Sandwiches', ar: 'السندوتشات الفاخرة' },
          order: 1,
          items: [
            {
              id: 'ext_item_1_1',
              name: { en: 'Grilled Chicken Club', ar: 'كلوب ساندوتش دجاج مشوي' },
              description: {
                en: 'Smoked turkey, grilled chicken, cheddar cheese, crisp lettuce, tomato, and club mayo.',
                ar: 'تركي مدخن، دجاج مشوي، جبن شيدر، خس مقرمش، طماطم، ومايونيز كلوب.'
              },
              price: 110,
              imageUrl: 'https://images.unsplash.com/photo-1567234669003-dce7a7a88821?w=400&auto=format&fit=crop&q=80',
              isAvailable: true,
              isHidden: false,
              variants: [],
              addons: [],
              order: 1
            },
            {
              id: 'ext_item_1_2',
              name: { en: 'Philly Steak & Cheese', ar: 'فيلي ستيك بالجبنة' },
              description: {
                en: 'Shredded beef ribeye, caramelized onions, green bell peppers, and melted swiss cheese in a sub.',
                ar: 'شرائح لحم ريب آي، بصل مكرمل، فلفل أخضر، وجبنة سويسرية ذائبة في خبز صب.'
              },
              price: 180,
              imageUrl: 'https://images.unsplash.com/photo-1521390188846-e2a3a97453a0?w=400&auto=format&fit=crop&q=80',
              isAvailable: true,
              isHidden: false,
              variants: [],
              addons: [],
              order: 2
            }
          ]
        }
      ];
    } else {
      // image upload menu
      return [
        {
          id: 'ext_cat_1',
          name: { en: 'Traditional Sweets & Dessert', ar: 'الحلويات التقليدية والشرقية' },
          order: 1,
          items: [
            {
              id: 'ext_item_1_1',
              name: { en: 'Pistachio Kunafa', ar: 'كنافة بالفستق' },
              description: {
                en: 'Crispy shredded pastry baked with sweet cheese, soaked in hot sugar syrup and topped with pistachios.',
                ar: 'عجينة كنافة مقرمشة مخبوزة مع الجبن الحلو، غارقة في قطر السكر الساخن ومغطاة بالفستق الحلبي.'
              },
              price: 95,
              imageUrl: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?w=400&auto=format&fit=crop&q=80',
              isAvailable: true,
              isHidden: false,
              variants: [],
              addons: [
                { name: { en: 'Add Clotted Cream (Qashta)', ar: 'إضافة قشطة بلدي' }, price: 25 }
              ],
              order: 1
            },
            {
              id: 'ext_item_1_2',
              name: { en: 'Premium Chocolate Fudge', ar: 'فادج الشوكولاتة الفاخرة' },
              description: {
                en: 'Dense, rich chocolate cake slice topped with hot fudge and vanilla ice cream.',
                ar: 'شريحة كيك شوكولاتة كثيفة وغنية مغطاة بالفادج الساخن وآيس كريم الفانيليا.'
              },
              price: 110,
              imageUrl: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&auto=format&fit=crop&q=80',
              isAvailable: true,
              isHidden: false,
              variants: [],
              addons: [],
              order: 2
            }
          ]
        }
      ];
    }
  }
}

export const db = new MockDatabase();
