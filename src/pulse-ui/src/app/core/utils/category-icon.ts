const ICON_MAP: Record<string, string> = {
  rent: 'home', mortgage: 'house', housing: 'home', apartment: 'apartment', maintenance: 'build',
  furniture: 'weekend', appliances: 'kitchen', cleaning: 'cleaning_services', hoa: 'apartment',
  'home improvement': 'construction', renovation: 'construction', garden: 'yard', landscaping: 'yard',
  plumbing: 'plumbing', roofing: 'roofing_service', security: 'security',

  gas: 'local_gas_station', fuel: 'local_gas_station', parking: 'local_parking', car: 'directions_car',
  auto: 'directions_car', uber: 'local_taxi', lyft: 'local_taxi', taxi: 'local_taxi',
  bus: 'directions_bus', train: 'train', transit: 'directions_bus', tolls: 'toll', toll: 'toll',
  'car insurance': 'shield', 'car wash': 'local_car_wash', ev: 'ev_station', bike: 'pedal_bike',
  'car repair': 'car_repair', 'car maintenance': 'car_repair', tires: 'tire_repair',
  commute: 'commute', rideshare: 'local_taxi', scooter: 'electric_scooter',

  groceries: 'local_grocery_store', grocery: 'local_grocery_store', restaurant: 'restaurant',
  'dining out': 'restaurant', 'eating out': 'restaurant', coffee: 'coffee', cafe: 'local_cafe',
  pizza: 'local_pizza', 'fast food': 'lunch_dining', delivery: 'delivery_dining',
  snacks: 'icecream', alcohol: 'liquor', beer: 'local_bar', bar: 'local_bar', wine: 'liquor',
  bakery: 'bakery_dining', brunch: 'brunch_dining', lunch: 'lunch_dining', dinner: 'dinner_dining',
  food: 'restaurant', takeout: 'takeout_dining', breakfast: 'egg_alt', dessert: 'cake',
  tea: 'emoji_food_beverage', juice: 'local_cafe', smoothie: 'blender',

  clothing: 'checkroom', clothes: 'checkroom', shoes: 'checkroom', fashion: 'checkroom',
  amazon: 'shopping_cart', online: 'shopping_cart', shopping: 'shopping_bag',
  electronics: 'devices', gifts: 'redeem', jewelry: 'diamond',
  cosmetics: 'brush', beauty: 'face_retouching_natural', accessories: 'watch',
  home: 'home',

  electric: 'bolt', electricity: 'bolt', power: 'bolt', water: 'water_drop',
  internet: 'wifi', phone: 'phone_android', mobile: 'phone_android', cable: 'live_tv',
  utilities: 'bolt', utility: 'bolt', sewer: 'water_drop', trash: 'delete',
  'cell phone': 'phone_android', broadband: 'wifi', heating: 'thermostat', hvac: 'thermostat',

  netflix: 'live_tv', hulu: 'live_tv', disney: 'live_tv', streaming: 'live_tv',
  spotify: 'headphones', music: 'music_note', movies: 'movie', movie: 'movie', games: 'videogame_asset',
  gaming: 'sports_esports', concerts: 'celebration', entertainment: 'celebration', hobbies: 'palette',
  books: 'menu_book', subscriptions: 'subscriptions', subscription: 'subscriptions',
  theater: 'theater_comedy', podcast: 'podcasts', photography: 'photo_camera', art: 'palette',

  gym: 'fitness_center', fitness: 'fitness_center', workout: 'fitness_center',
  doctor: 'local_hospital', medical: 'medical_services', dental: 'medical_services',
  pharmacy: 'medication', medicine: 'medication', therapy: 'psychology', mental: 'psychology',
  vision: 'visibility', health: 'favorite', hospital: 'local_hospital', spa: 'spa',
  yoga: 'self_improvement', swimming: 'pool', supplements: 'medication',
  wellness: 'spa', chiropractor: 'medical_services', dermatology: 'dermatology',
  nutrition: 'nutrition', dietician: 'nutrition', physiotherapy: 'physical_therapy',

  tuition: 'school', school: 'school', college: 'school', university: 'school',
  courses: 'menu_book', textbooks: 'auto_stories', training: 'school', certification: 'verified',
  'class room': 'school', classroom: 'school', education: 'school', learning: 'menu_book',
  webinars: 'laptop', webinar: 'laptop', tutorials: 'play_circle',
  workshop: 'construction', seminar: 'co_present', mentoring: 'school',

  savings: 'savings', investment: 'trending_up', investing: 'trending_up', stocks: 'candlestick_chart',
  retirement: 'elderly', '401k': 'savings', ira: 'savings', 'credit card': 'credit_card',
  bank: 'account_balance', fees: 'receipt', 'bank fees': 'account_balance', taxes: 'receipt_long',
  tax: 'receipt_long', interest: 'percent', loan: 'payments', debt: 'payments',
  crypto: 'currency_bitcoin', mutual: 'trending_up', etf: 'candlestick_chart', bonds: 'savings',
  'financial planning': 'account_balance', atm: 'atm', 'wire transfer': 'send_money',

  office: 'business_center', supplies: 'inventory_2', tools: 'handyman',
  software: 'laptop', coworking: 'meeting_room', business: 'business_center',
  professional: 'work', freelance: 'laptop',
  printing: 'print', shipping: 'local_shipping', postage: 'mail', stationery: 'edit_note',

  kids: 'child_care', children: 'child_care', childcare: 'child_care', daycare: 'child_care',
  baby: 'child_friendly', pets: 'pets', pet: 'pets', dog: 'pets', cat: 'pets', vet: 'pets',
  family: 'diversity_3', personal: 'face', grooming: 'face', haircut: 'face',
  laundry: 'local_laundry_service', 'dry cleaning': 'local_laundry_service',
  birthday: 'cake', wedding: 'favorite', anniversary: 'celebration',

  insurance: 'shield', 'home insurance': 'shield', 'health insurance': 'health_and_safety',
  'life insurance': 'shield', legal: 'gavel', lawyer: 'gavel',
  'auto insurance': 'shield', 'renters insurance': 'shield', notary: 'gavel',

  vacation: 'flight', travel: 'flight', hotel: 'hotel', airfare: 'flight', flights: 'flight',
  lodging: 'hotel', camping: 'hiking', beach: 'beach_access',
  'road trip': 'directions_car', cruise: 'sailing', luggage: 'luggage', passport: 'badge',
  sightseeing: 'tour', resort: 'villa',

  soccer: 'sports_soccer', football: 'sports_football', basketball: 'sports_basketball',
  tennis: 'sports_tennis', golf: 'sports_golf', baseball: 'sports_baseball',
  cricket: 'sports_cricket', hockey: 'sports_hockey', rugby: 'sports_rugby',
  volleyball: 'sports_volleyball', martial: 'sports_martial_arts', boxing: 'sports_mma',
  skiing: 'downhill_skiing', snowboard: 'snowboarding', surf: 'surfing', skateboard: 'skateboarding',
  running: 'directions_run', hiking: 'hiking', climbing: 'terrain', cycling: 'pedal_bike',

  salary: 'payments', paycheck: 'payments', wage: 'payments', bonus: 'card_giftcard',
  dividend: 'trending_up', dividends: 'trending_up',
  'side hustle': 'work', refund: 'replay', cashback: 'replay',
  rental: 'real_estate_agent', 'rental income': 'real_estate_agent',
  tips: 'paid', commission: 'paid', royalties: 'paid', freelancing: 'laptop',

  miscellaneous: 'more_horiz', other: 'more_horiz', misc: 'more_horiz',
  charity: 'volunteer_activism', donation: 'volunteer_activism', donations: 'volunteer_activism',
  church: 'volunteer_activism', tithe: 'volunteer_activism', tithing: 'volunteer_activism',
  'non-profit': 'volunteer_activism', giving: 'volunteer_activism',
  storage: 'warehouse', moving: 'local_shipping', gratuity: 'paid',
};

export function inferCategoryIcon(name: string | null | undefined, existingIcon: string | null | undefined, fallback = 'category'): string {
  if (existingIcon && existingIcon !== 'category' && existingIcon !== 'label') return existingIcon;
  if (!name) return fallback;
  const key = name.toLowerCase().trim();
  if (ICON_MAP[key]) return ICON_MAP[key];
  for (const [keyword, icon] of Object.entries(ICON_MAP)) {
    if (key.includes(keyword) || keyword.includes(key)) return icon;
  }
  return existingIcon || fallback;
}
