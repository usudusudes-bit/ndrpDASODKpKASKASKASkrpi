import { useState, useEffect } from 'react'
import { Search, Star, Ticket, User, X, Copy, Check, Settings, ShoppingBag, Flame, Shield, Database, Users, Gift, Activity } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import './App.css'

async function customInvoke(cmd: string, args?: any): Promise<any> {
  console.log(`[API] Calling command: ${cmd} with args:`, args);
  
  const response = await fetch(`/api/${cmd}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(args || {})
  });

  let data;
  try {
    data = await response.json();
  } catch (e) {
    throw new Error(`Ошибка сервера: Неверный ответ от бэкенда. Возможно, сервер не запущен или нужно его перезапустить.`);
  }

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Ошибка сервера');
  }

  return data.result;
}

const Logo = () => (
  <div className="flex items-center justify-center font-black text-2xl tracking-tighter text-orange-600 drop-shadow-sm">
    <img 
      src="/logo.png" 
      alt="HotLand" 
      className="h-10 w-10 object-cover rounded-xl" 
      onError={(e) => {
        (e.target as HTMLElement).style.display = 'none';
        (e.target as HTMLElement).nextElementSibling!.classList.remove('hidden');
      }} 
    />
    <div className="flex items-center hidden">
      <span className="text-orange-950">HOT</span>LAND
    </div>
  </div>
)

function App({ defaultTab = 'main' }: { defaultTab?: string }) {
  const [activeTab, setActiveTab] = useState(defaultTab)
  const [searchQuery, setSearchQuery] = useState('')
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [repeatPassword, setRepeatPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [authSuccess, setAuthSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [loggedInUser, setLoggedInUser] = useState<string | null>(null)
  const [loggedInEmail, setLoggedInEmail] = useState<string | null>(null)
  
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null)
  const [selectedDuration, setSelectedDuration] = useState<any | null>(null)
  const [promoCode, setPromoCode] = useState('')
  const [ticketAmount, setTicketAmount] = useState<number>(100)
  
  const [copiedIp, setCopiedIp] = useState(false)
  const [onlineCount, setOnlineCount] = useState<string>('Загрузка...')

  useEffect(() => {
    setActiveTab(defaultTab)
  }, [defaultTab])

  useEffect(() => {
    setUsername('')
    setEmail('')
    setPassword('')
    setRepeatPassword('')
    setAuthError('')
    setAuthSuccess('')
  }, [authMode, isAuthModalOpen])

  useEffect(() => {
    const fetchOnline = async () => {
      try {
        const res = await customInvoke('rcon_online');
        setOnlineCount(res);
      } catch (e) {
        setOnlineCount('0');
      }
    };
    fetchOnline();
    const interval = setInterval(fetchOnline, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError('')
    setAuthSuccess('')
    
    if (authMode === 'login' && (!username || !password)) {
      setAuthError('Заполните все поля')
      return
    }

    if (authMode === 'register' && (!username || !email || !password)) {
      setAuthError('Заполните все поля')
      return
    }

    if (authMode === 'register' && password !== repeatPassword) {
      setAuthError('Пароли не совпадают')
      return
    }

    setIsLoading(true)

    try {
      if (authMode === 'register') {
        const res: any = await customInvoke('register', { username, email, password })
        let successMsg = res;
        try {
          const parsed = typeof res === 'string' ? JSON.parse(res) : res;
          successMsg = parsed.msg || res;
          setLoggedInUser(parsed.username || username);
          setLoggedInEmail(parsed.email || email);
        } catch {
          setLoggedInUser(username);
          setLoggedInEmail(email);
        }
        setAuthSuccess(successMsg)
        setTimeout(() => setIsAuthModalOpen(false), 1500)
      } else {
        const res: string = await customInvoke('login', { identifier: username, password })
        try {
          const parsed = JSON.parse(res)
          setLoggedInUser(parsed.username)
          setLoggedInEmail(parsed.email)
          setAuthSuccess(parsed.msg)
        } catch {
          setLoggedInUser(username.split('@')[0])
          setAuthSuccess(res)
        }
        setTimeout(() => setIsAuthModalOpen(false), 1500)
      }
    } catch (err: any) {
      setAuthError(typeof err === 'string' ? err : JSON.stringify(err))
    } finally {
      setIsLoading(false)
    }
  }

  const products = [
    {
      id: 'super',
      name: 'Привилегия SUPER',
      desc: 'Максимальные возможности на сервере!',
      type: 'super',
      prices: [
        { duration: '1 месяц', price: '249₽', value: '249', easydonateId: 1086822 }, // Укажите реальные ID товаров из EasyDonate
        { duration: '3 месяца', price: '599₽', value: '599', easydonateId: 1086821 },
        { duration: 'навсегда', price: '849₽', value: '849', easydonateId: 1086819 }
      ]
    },
    {
      id: 'host',
      name: 'Оплата хостинга',
      desc: 'Поддержите сервер и получите уникальные бонусы.',
      type: 'host',
      prices: [
        { duration: '1 месяц', price: '1000₽', value: '1000', easydonateId: 1086836 },
        { duration: '3 месяца', price: '3000₽', value: '3000', easydonateId: 1086835 }
      ]
    }
  ]

  const currencies = [
    {
      id: 'tickets',
      name: 'Тикеты',
      desc: 'Премиум валюта для покупки кейсов. 1 тикет = 1 рубль.',
      type: 'currency',
      prices: [],
      easydonateId: 1086831 // Укажите ID товара "1 тикет" из EasyDonate
    }
  ]

  const filteredPrivileges = products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
  const filteredCurrencies = currencies.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))

  const handlePurchase = async () => {
    if (!loggedInUser) {
      setIsAuthModalOpen(true);
      return;
    }
    if (!selectedProduct) return;

    let productId: number;
    let productQuantity = 1;

    if (selectedProduct.type === 'currency') {
      productId = selectedProduct.easydonateId;
      productQuantity = ticketAmount;
    } else {
      if (!selectedDuration) return;
      productId = selectedDuration.easydonateId;
    }

    try {
      const paymentUrl = await customInvoke('create_payment', {
        username: loggedInUser,
        email: loggedInEmail,
        coupon: promoCode,
        products: { [productId]: productQuantity }
      });
      
      // Перенаправляем пользователя на сгенерированную ссылку оплаты
      window.location.href = paymentUrl;
      
    } catch (e: any) {
      console.error(e);
      let errMsg = typeof e === 'string' ? e : (e?.message || JSON.stringify(e));
      alert(`Ошибка при создании платежа: ${errMsg}`);
    }
  }

  return (
    <div className="min-h-screen font-sans relative">
      <div className="app-bg" />

      <header className="relative z-10 p-6 flex flex-col md:flex-row items-center justify-between gap-4 max-w-7xl mx-auto">
        <div className="w-full md:w-1/3 relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-orange-400" />
          </div>
          <input
            type="text"
            placeholder="Поиск товаров..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              if (e.target.value.length > 0 && activeTab !== 'privileges') {
                setActiveTab('privileges')
              }
            }}
            className="w-full bg-white/60 backdrop-blur-md border border-orange-200 rounded-2xl py-3 pl-12 pr-4 text-orange-950 placeholder-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all shadow-lg"
          />
        </div>

        <div className="flex items-center gap-4 ml-auto flex-wrap justify-center">
          <div className="flex gap-2 bg-white/80 backdrop-blur-md p-1.5 rounded-2xl border border-orange-200 shadow-xl overflow-x-auto max-w-[100vw]">
            <button
              onClick={() => setActiveTab('main')}
              className={`px-3 py-2 md:px-5 md:py-2.5 rounded-xl font-medium transition-all duration-300 whitespace-nowrap ${
                activeTab === 'main' 
                  ? 'bg-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.4)]' 
                  : 'text-orange-600 hover:text-orange-900 hover:bg-orange-50'
              }`}
            >
              Главная
            </button>
            <button
              onClick={() => setActiveTab('privileges')}
              className={`px-3 py-2 md:px-5 md:py-2.5 rounded-xl font-medium transition-all duration-300 whitespace-nowrap ${
                activeTab === 'privileges' 
                  ? 'bg-amber-400 text-orange-950 shadow-[0_0_15px_rgba(250,204,21,0.4)]' 
                  : 'text-orange-600 hover:text-orange-900 hover:bg-orange-50'
              }`}
            >
              Магазин
            </button>
            {loggedInUser === 'ADMIN' && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`px-3 py-2 md:px-5 md:py-2.5 rounded-xl font-medium transition-all duration-300 whitespace-nowrap ${
                  activeTab === 'admin' 
                    ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(255,0,0,0.4)]' 
                    : 'text-red-500 hover:text-white hover:bg-red-50'
                }`}
              >
                Админ
              </button>
            )}
          </div>

          {loggedInUser ? (
            <button 
              onClick={() => setActiveTab('profile')}
              className={`flex items-center justify-center gap-2 p-2.5 md:px-4 md:py-2.5 rounded-2xl shadow-xl transition-all duration-300 ${
                activeTab === 'profile'
                  ? 'bg-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.4)]'
                  : 'bg-white/80 text-orange-950 border border-orange-300 hover:border-orange-500 hover:bg-orange-50'
              }`}
            >
              <User className={`w-5 h-5 ${activeTab === 'profile' ? 'text-white' : 'text-orange-500'}`} />
              <span className="hidden md:inline font-medium">{loggedInUser}</span>
            </button>
          ) : (
            <button 
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center justify-center gap-2 bg-white/80 hover:bg-orange-50 text-orange-950 border border-orange-200 hover:border-orange-500/50 transition-all duration-300 p-2.5 md:px-4 md:py-2.5 rounded-2xl shadow-xl"
            >
              <User className="w-5 h-5 text-orange-500" />
              <span className="hidden md:inline font-medium">Войти</span>
            </button>
          )}

          <div className="flex-shrink-0 ml-2">
            <Logo />
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto p-6 pt-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          key={activeTab}
        >
          {activeTab === 'main' && (
            <div className="flex flex-col md:flex-row items-center justify-between min-h-[60vh] gap-12">
              <div className="md:w-1/2 flex flex-col gap-6 text-center md:text-left z-10 relative">
                <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-500 drop-shadow-sm">
                  HOTLAND
                </h1>
                <h2 className="text-3xl md:text-4xl font-bold text-orange-950">
                  Ваш любимый сервер Minecraft
                </h2>
                <p className="text-xl text-orange-800 leading-relaxed">
                  Погрузитесь в мир ванильного выживания с улучшенными механиками, 
                  отзывчивой администрацией и дружным комьюнити. Без приватов, 
                  без доната, влияющего на баланс!
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 mt-4 items-center md:items-start">
                  <div className="flex flex-col gap-2">
                    <span className="text-orange-600 font-medium">Версия: <span className="text-orange-950">1.21.11</span></span>
                    <span className="text-orange-600 font-medium">Онлайн: <span className="text-green-600 font-bold">{onlineCount}</span></span>
                  </div>
                  
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText('play.hotland.site');
                      setCopiedIp(true);
                      setTimeout(() => setCopiedIp(false), 2000);
                    }}
                    className="sm:ml-auto relative group overflow-hidden rounded-2xl bg-white border-2 border-orange-400 hover:border-orange-500 px-8 py-4 transition-all duration-300 shadow-xl hover:shadow-2xl"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-100 to-amber-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative flex items-center gap-3 font-bold text-orange-950">
                      {copiedIp ? <Check className="text-green-500" /> : <Copy className="text-orange-500" />}
                      {copiedIp ? 'Скопировано!' : 'Скопировать IP'}
                    </div>
                  </button>
                </div>
              </div>
              
              <div className="md:w-1/2 relative h-[400px] md:h-[500px] w-full flex items-center justify-center">
                <motion.div 
                  animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute z-20 w-48 h-48 md:w-64 md:h-64"
                >
                  <div className="w-full h-full rounded-[3rem] shadow-[0_20px_50px_rgba(249,115,22,0.3)] flex items-center justify-center border-4 border-white overflow-hidden relative bg-white rotate-3 group hover:rotate-0 transition-transform duration-500">
                    <img 
                      src="/logo.png" 
                      alt="Hero Logo" 
                      className="w-full h-full object-cover absolute z-10" 
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                        (e.target as HTMLElement).nextElementSibling!.classList.remove('hidden');
                      }} 
                    />
                    <Flame className="w-24 h-24 text-orange-500 hidden" />
                  </div>
                </motion.div>
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ 
                      y: [0, Math.random() * -40 - 20, 0],
                      x: [0, Math.random() * 40 - 20, 0],
                      rotate: [0, Math.random() * 360, 0]
                    }}
                    transition={{ 
                      duration: Math.random() * 3 + 4, 
                      repeat: Infinity, 
                      ease: "easeInOut",
                      delay: Math.random() * 2
                    }}
                    className="absolute z-10 w-12 h-12 bg-amber-400 border-4 border-white shadow-[0_10px_20px_rgba(250,204,21,0.3)] rounded-2xl flex items-center justify-center"
                    style={{
                      left: `${20 + i * 15}%`,
                      top: `${10 + (i % 3) * 30}%`
                    }}
                  >
                    <div className="w-4 h-4 bg-white rounded-md" />
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'profile' && loggedInUser && (
            <div className="max-w-4xl mx-auto">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-8 bg-white/80 backdrop-blur-md border border-orange-200 p-8 rounded-3xl shadow-xl mb-8">
                <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center flex-shrink-0 shadow-[0_10px_20px_rgba(249,115,22,0.3)]">
                  <User className="w-16 h-16 text-white" />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-4xl font-bold text-orange-950 mb-2">{loggedInUser}</h2>
                  <p className="text-orange-600 mb-6">Пользователь HotLandSITE</p>
                  <div className="flex flex-wrap justify-center md:justify-start gap-4">
                    <button className="flex items-center gap-2 bg-orange-50 hover:bg-orange-100 text-orange-950 px-5 py-2.5 rounded-xl transition-colors font-medium border border-orange-200">
                      <Settings className="w-5 h-5" />
                      Настройки
                    </button>
                    <button 
                      onClick={() => {
                        setLoggedInUser(null);
                        setActiveTab('main');
                      }}
                      className="flex items-center gap-2 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 px-5 py-2.5 rounded-xl transition-colors font-medium"
                    >
                      Выйти
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'admin' && loggedInUser === 'ADMIN' && (
            <AdminPanel />
          )}

          {activeTab === 'privileges' && (
            <div className="pb-20">
              <h2 className="text-3xl font-bold mb-12 text-orange-950 flex items-center gap-3">
                <Star className="text-orange-500" /> 
                Привилегии и Товары
              </h2>
              {filteredPrivileges.length === 0 ? (
                <p className="text-orange-600 text-center py-10 text-xl">Ничего не найдено :(</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                  {filteredPrivileges.map(item => (
                    <motion.div 
                      key={item.id}
                      whileHover={{ scale: 1.05, y: -5 }}
                      onClick={() => {
                        setSelectedProduct(item);
                        setSelectedDuration(item.prices[0]);
                      }}
                      className="bg-white/80 backdrop-blur-md border border-orange-200 rounded-3xl p-6 flex flex-col items-center text-center hover:border-orange-400 transition-all duration-300 shadow-xl cursor-pointer"
                    >
                      <div className="w-full h-40 rounded-xl overflow-hidden relative mb-6">
                        <img 
                          src={`/${item.id}.png`} 
                          alt={item.name} 
                          className="w-full h-full object-contain absolute inset-0 z-20"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                            const fallback = (e.target as HTMLElement).nextElementSibling;
                            if (fallback) {
                              fallback.classList.remove('hidden');
                              fallback.classList.add('flex');
                            }
                          }}
                        />
                        <div className="hidden w-full h-full relative z-10 flex-col items-center justify-center">
                          <div className={`w-full h-full absolute inset-0 ${item.type === 'super' ? 'bg-green-500/20 group-hover:bg-green-500/30' : 'bg-orange-500/20 group-hover:bg-orange-500/30'} blur-2xl transition-colors duration-500`} />
                          <div className={`relative z-10 ${item.type === 'super' ? 'bg-green-500' : 'bg-orange-500'} text-white px-8 py-3 rounded-xl shadow-lg transform -rotate-2 group-hover:rotate-0 transition-transform duration-300`}>
                            <span className="font-black text-2xl tracking-wider drop-shadow-md">{item.type === 'super' ? 'SUPER' : 'HOSTING'}</span>
                          </div>
                        </div>
                      </div>
                      
                      <h3 className="text-2xl font-bold text-orange-950 mb-2 mt-6">{item.name}</h3>
                      <p className="text-orange-800 mb-6">{item.desc}</p>
                      
                      <button className={`w-full ${item.type === 'super' ? 'bg-green-500 hover:bg-green-600 shadow-[0_5px_15px_rgba(34,197,94,0.3)]' : 'bg-orange-500 hover:bg-orange-600 shadow-[0_5px_15px_rgba(249,115,22,0.3)]'} text-white font-bold py-3 px-6 rounded-xl transition-colors`}>
                        Купить от {item.prices[0].price}
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}

              <h2 className="text-3xl font-bold mb-12 mt-16 text-orange-950 flex items-center gap-3">
                <Ticket className="text-amber-500" /> 
                Игровая валюта
              </h2>
              {filteredCurrencies.length === 0 ? (
                <p className="text-orange-600 text-center py-10 text-xl">Ничего не найдено :(</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredCurrencies.map(item => (
                    <motion.div 
                      key={item.id}
                      whileHover={{ scale: 1.05, y: -5 }}
                      onClick={() => {
                        setSelectedProduct(item);
                      }}
                      className="bg-white/80 backdrop-blur-md border border-amber-200 rounded-3xl p-6 flex flex-col items-center text-center hover:border-amber-400 transition-all duration-300 shadow-xl cursor-pointer"
                    >
                      <div className="w-full h-40 rounded-xl overflow-hidden relative mb-6">
                        <img 
                          src={`/${item.id}.png`} 
                          alt={item.name} 
                          className="w-full h-full object-contain absolute inset-0 z-20"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                            const fallback = (e.target as HTMLElement).nextElementSibling;
                            if (fallback) {
                              fallback.classList.remove('hidden');
                              fallback.classList.add('flex');
                            }
                          }}
                        />
                        <div className="hidden w-full h-full relative z-10 flex-col items-center justify-center">
                        <div className="w-full h-full absolute inset-0 bg-amber-500/20 blur-2xl group-hover:bg-amber-500/30 transition-colors duration-500" />
                          <div className="relative z-10 flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-400 text-white px-8 py-4 rounded-xl shadow-lg transform -rotate-2 group-hover:rotate-0 transition-transform duration-300">
                            <Ticket className="w-8 h-8" />
                            <span className="font-black text-2xl tracking-widest">TICKET</span>
                          </div>
                        </div>
                      </div>
                      
                      <h3 className="text-2xl font-bold text-orange-950 mb-2 mt-6">{item.name}</h3>
                      <p className="text-amber-700 mb-6 font-medium">{item.desc}</p>
                      
                      <button className="w-full bg-amber-400 hover:bg-amber-500 text-orange-950 font-bold py-3 px-6 rounded-xl transition-colors shadow-[0_5px_15px_rgba(250,204,21,0.3)]">
                        Купить
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.div>
      </main>

      <footer className="relative z-10 bg-white/60 backdrop-blur-md border-t border-orange-200 mt-10">
        <div className="max-w-7xl mx-auto p-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col items-center md:items-start gap-4">
            <Logo />
            <p className="text-orange-800 font-medium text-center md:text-left max-w-sm">
              Лучший ванильный сервер Minecraft. Играй, развивайся, общайся.
            </p>
          </div>
          
          <div className="transform hover:scale-105 transition-transform duration-300 drop-shadow-xl hover:drop-shadow-2xl flex items-center justify-center">
            <img src="/discord_qr.png" alt="Discord QR" className="w-56 h-auto object-contain" onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://discord.gg/hotland';
            }} />
          </div>
        </div>
      </footer>

      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-orange-950/60 backdrop-blur-sm"
              onClick={() => {
                setSelectedProduct(null);
                setPromoCode('');
              }}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white border border-orange-200 shadow-2xl rounded-3xl overflow-hidden"
            >
              <div className="p-6 border-b border-orange-100 flex justify-between items-center bg-orange-50/50">
                <h3 className="text-2xl font-bold text-orange-950">
                  Покупка
                </h3>
                <button 
                  onClick={() => {
                    setSelectedProduct(null);
                    setPromoCode('');
                  }}
                  className="text-orange-400 hover:text-orange-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6">
                <div className="flex flex-col items-center mb-6">
                  <h3 className="text-3xl font-bold text-orange-950 mb-2">{selectedProduct.name}</h3>
                  <p className="text-orange-600 text-center">{selectedProduct.desc}</p>
                </div>

                <div className="space-y-4">
                  {selectedProduct.type === 'currency' ? (
                    <div>
                      <label className="block text-sm font-medium text-orange-800 mb-1.5">Количество (1 тикет = 1₽)</label>
                      <input 
                        type="number" 
                        min="1"
                        value={ticketAmount}
                        onChange={(e) => setTicketAmount(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full bg-orange-50 border border-orange-200 rounded-xl py-3 px-4 text-orange-950 placeholder-orange-400 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all"
                      />
                    </div>
                  ) : (
                    selectedProduct.prices?.length > 1 && (
                      <div>
                        <label className="block text-sm font-medium text-orange-800 mb-1.5">Срок действия</label>
                        <div className="grid grid-cols-3 gap-2">
                          {selectedProduct.prices.map((p: any) => (
                            <button
                              key={p.duration}
                              onClick={() => setSelectedDuration(p)}
                              className={`py-2 px-3 rounded-xl border text-sm font-medium transition-all ${selectedDuration?.duration === p.duration ? 'bg-orange-100 border-orange-500 text-orange-800' : 'bg-white border-orange-200 text-orange-600 hover:border-orange-400'}`}
                            >
                              {p.duration}
                            </button>
                          ))}
                        </div>
                      </div>
                    )
                  )}

                  <div>
                    <label className="block text-sm font-medium text-orange-800 mb-1.5">Никнейм на сервере</label>
                    <input 
                      type="text" 
                      defaultValue={loggedInUser || ''}
                      placeholder="Ваш никнейм"
                      className="w-full bg-orange-50 border border-orange-200 rounded-xl py-3 px-4 text-orange-950 placeholder-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-orange-800 mb-1.5">Промокод (если есть)</label>
                    <input 
                      type="text" 
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      placeholder="PROMO2024"
                      className="w-full bg-orange-50 border border-orange-200 rounded-xl py-3 px-4 text-orange-950 placeholder-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all uppercase"
                    />
                  </div>
                </div>

                <button 
                  onClick={handlePurchase}
                  className={`w-full ${selectedProduct.type === 'super' ? 'bg-green-500 hover:bg-green-600 shadow-[0_5px_15px_rgba(34,197,94,0.3)]' : selectedProduct.type === 'currency' ? 'bg-amber-400 hover:bg-amber-500 shadow-[0_5px_15px_rgba(250,204,21,0.3)] text-orange-950' : 'bg-orange-600 hover:bg-orange-800 shadow-[0_5px_15px_rgba(234,88,12,0.3)]'} text-white font-bold py-4 px-6 rounded-xl transition-colors mt-6 text-lg flex items-center justify-center gap-2`}
                >
                  <ShoppingBag className="w-5 h-5" />
                  Оплатить {selectedProduct.type === 'currency' ? `${ticketAmount}₽` : (selectedDuration?.price || selectedProduct.prices[0].price)}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAuthModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-orange-950/60 backdrop-blur-sm"
              onClick={() => setIsAuthModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white border border-orange-200 shadow-2xl rounded-3xl overflow-hidden"
            >
              <div className="p-6 border-b border-orange-100 flex justify-between items-center bg-orange-50/50">
                <h3 className="text-2xl font-bold text-orange-950">
                  {authMode === 'login' ? 'Вход в аккаунт' : 'Регистрация'}
                </h3>
                <button 
                  onClick={() => setIsAuthModalOpen(false)}
                  className="text-orange-400 hover:text-orange-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6">
                <form className="space-y-4" onSubmit={handleAuth}>
                  {authError && (
                    <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl text-sm text-center">
                      {authError}
                    </div>
                  )}
                  {authSuccess && (
                    <div className="bg-green-50 border border-green-200 text-green-600 p-3 rounded-xl text-sm text-center">
                      {authSuccess}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-orange-800 mb-1.5">
                      {authMode === 'login' ? 'Никнейм или Email' : 'Никнейм'}
                    </label>
                    <input 
                      type="text" 
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder={authMode === 'login' ? 'player1 или email@example.com' : 'Ваш ник на сервере'}
                      className="w-full bg-orange-50 border border-orange-200 rounded-xl py-3 px-4 text-orange-950 placeholder-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
                    />
                  </div>

                  {authMode === 'register' && (
                    <div>
                      <label className="block text-sm font-medium text-orange-800 mb-1.5">Email</label>
                      <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Ваш email адрес"
                        className="w-full bg-orange-50 border border-orange-200 rounded-xl py-3 px-4 text-orange-950 placeholder-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
                      />
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-orange-800 mb-1.5">Пароль</label>
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-orange-50 border border-orange-200 rounded-xl py-3 px-4 text-orange-950 placeholder-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
                    />
                  </div>

                  {authMode === 'register' && (
                    <div>
                      <label className="block text-sm font-medium text-orange-800 mb-1.5">Повторите пароль</label>
                      <input 
                        type="password" 
                        value={repeatPassword}
                        onChange={(e) => setRepeatPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-orange-50 border border-orange-200 rounded-xl py-3 px-4 text-orange-950 placeholder-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
                      />
                    </div>
                  )}

                  <button 
                    disabled={isLoading}
                    className="w-full bg-orange-600 hover:bg-orange-800 text-white font-bold py-3.5 px-6 rounded-xl transition-colors shadow-[0_5px_15px_rgba(234,88,12,0.3)] mt-6 disabled:opacity-50"
                  >
                    {isLoading ? 'Загрузка...' : (authMode === 'login' ? 'Войти' : 'Зарегистрироваться')}
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-orange-600 text-sm">
                    {authMode === 'login' ? 'Нет аккаунта? ' : 'Уже есть аккаунт? '}
                    <button 
                      onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                      className="text-amber-500 hover:text-amber-600 font-bold transition-colors"
                    >
                      {authMode === 'login' ? 'Зарегистрироваться' : 'Войти'}
                    </button>
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

function AdminPanel() {
  const [activeTab, setActiveTab] = useState('stats');
  const [stats, setStats] = useState({ users: 0, purchases: 0 });
  const [rconHost, setRconHost] = useState('');
  const [rconPort, setRconPort] = useState('');
  const [rconPassword, setRconPassword] = useState('');
  const [rconStatus, setRconStatus] = useState<string>('Проверка...');
  const [easydonateKey, setEasydonateKey] = useState('');
  const [easydonateServerId, setEasydonateServerId] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [promos, setPromos] = useState<any[]>([]);
  const [promoPercentage, setPromoPercentage] = useState<number>(0);
  const [promoUses, setPromoUses] = useState<number>(1);
  const [selectedUserForGift, setSelectedUserForGift] = useState<any>(null);

  const fetchStats = async () => {
    try {
      const res = await customInvoke('get_stats');
      setStats(JSON.parse(res));
    } catch (e) { console.error(e); }
  };

  const fetchUsers = async () => {
    try {
      const res = await customInvoke('get_users');
      setUsers(res);
    } catch (e) { console.error(e); }
  };

  const fetchPromos = async () => {
    try {
      const res = await customInvoke('get_promocodes');
      setPromos(res);
    } catch (e) { console.error(e); }
  };

  const fetchRcon = async () => {
    try {
      const res = await customInvoke('get_rcon');
      setRconHost(res.host);
      setRconPort(res.port);
      setRconPassword(res.password || '');
      
      const onlineRes = await customInvoke('rcon_online');
      if (onlineRes !== "0" || onlineRes === "0") {
         setRconStatus(`Подключено (Онлайн: ${onlineRes})`);
      } else {
         setRconStatus('Ошибка подключения');
      }
    } catch (e) { 
      console.error(e); 
      setRconStatus('Ошибка подключения');
    }
  };

  const fetchEasydonate = async () => {
    try {
      const res = await customInvoke('get_easydonate');
      setEasydonateKey(res.shop_key);
      setEasydonateServerId(res.server_id);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchStats();
    fetchUsers();
    fetchPromos();
    fetchRcon();
    fetchEasydonate();
  }, []);

  const handleSaveRcon = async () => {
    try {
      const res = await customInvoke('save_rcon', { host: rconHost, port: rconPort, password: rconPassword });
      alert(res);
      fetchRcon();
    } catch (e) { alert(e); }
  };

  const handleSaveEasydonate = async () => {
    try {
      const res = await customInvoke('save_easydonate', { shop_key: easydonateKey, server_id: easydonateServerId });
      alert(res);
    } catch (e) { alert(e); }
  };

  const handleGeneratePromo = async () => {
    try {
      await customInvoke('generate_promocode', { uses: promoUses, percentage: promoPercentage });
      fetchPromos();
    } catch (e) { alert(e); }
  };

  const handleDeletePromo = async (id: number) => {
    try {
      await customInvoke('delete_promocode', { id });
      fetchPromos();
    } catch (e) { alert(e); }
  };

  const handleToggleBan = async (id: number, currentStatus: number) => {
    try {
      const res = await customInvoke('toggle_ban', { id, is_banned: !currentStatus });
      alert(res);
      fetchUsers();
    } catch (e) { alert(e); }
  };

  return (
    <div className="max-w-6xl mx-auto bg-white/80 backdrop-blur-md border border-orange-200 rounded-3xl p-8 shadow-xl">
      <h2 className="text-3xl font-bold text-orange-950 mb-8 flex items-center gap-3">
        <Shield className="text-red-500" /> Панель Администратора
      </h2>
      
      <div className="flex gap-4 mb-8 border-b border-orange-100 pb-4 overflow-x-auto">
        {[
          { id: 'stats', name: 'Статистика', icon: Activity },
          { id: 'rcon', name: 'RCON', icon: Database },
          { id: 'easydonate', name: 'EasyDonate', icon: ShoppingBag },
          { id: 'promo', name: 'Промокоды', icon: Gift },
          { id: 'users', name: 'Пользователи', icon: Users }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${activeTab === t.id ? 'bg-red-500 text-white' : 'bg-orange-50 text-orange-600 hover:bg-orange-100'}`}
          >
            <t.icon className="w-4 h-4" />
            {t.name}
          </button>
        ))}
      </div>

      <div>
        {activeTab === 'stats' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100">
              <h3 className="text-orange-600 mb-2">Всего пользователей</h3>
              <p className="text-4xl font-bold text-orange-950">{stats.users}</p>
            </div>
            <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100">
              <h3 className="text-orange-600 mb-2">Всего покупок</h3>
              <p className="text-4xl font-bold text-orange-950">{stats.purchases}</p>
            </div>
          </div>
        )}

        {activeTab === 'rcon' && (
          <div className="max-w-md space-y-4">
            <div>
              <label className="block text-sm text-orange-800 mb-1">Хост</label>
              <input type="text" value={rconHost} onChange={e => setRconHost(e.target.value)} className="w-full bg-white border border-orange-200 rounded-xl py-2 px-4 text-orange-950" />
            </div>
            <div>
              <label className="block text-sm text-orange-800 mb-1">Порт</label>
              <input type="text" value={rconPort} onChange={e => setRconPort(e.target.value)} className="w-full bg-white border border-orange-200 rounded-xl py-2 px-4 text-orange-950" />
            </div>
            <div>
              <label className="block text-sm text-orange-800 mb-1">Пароль</label>
              <input type="password" value={rconPassword} onChange={e => setRconPassword(e.target.value)} className="w-full bg-white border border-orange-200 rounded-xl py-2 px-4 text-orange-950" />
            </div>
            <button onClick={handleSaveRcon} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-xl mt-4 w-full">
              Сохранить настройки
            </button>
            <div className="mt-8 p-4 bg-orange-50 border border-orange-200 rounded-xl">
              <h3 className="text-orange-800 text-sm mb-2">Статус RCON соединения:</h3>
              <p className={`font-medium ${rconStatus.includes('Ошибка') ? 'text-red-500' : 'text-green-600'}`}>
                {rconStatus}
              </p>
            </div>
          </div>
        )}

        {activeTab === 'easydonate' && (
          <div className="max-w-md space-y-4">
            <div className="bg-orange-50 p-4 rounded-xl border border-orange-200 mb-6">
              <h3 className="text-orange-950 font-medium mb-2">Настройка интеграции</h3>
              <p className="text-orange-600 text-sm">
                Shop-Key можно найти в панели EasyDonate в разделе "Настройки API".<br/>
                Server ID можно найти в разделе "Серверы" (числовой идентификатор).
              </p>
            </div>
            <div>
              <label className="block text-sm text-orange-800 mb-1">Shop-Key</label>
              <input type="password" value={easydonateKey} onChange={e => setEasydonateKey(e.target.value)} placeholder="Ваш Shop-Key" className="w-full bg-white border border-orange-200 rounded-xl py-2 px-4 text-orange-950" />
            </div>
            <div>
              <label className="block text-sm text-orange-800 mb-1">Server ID</label>
              <input type="text" value={easydonateServerId} onChange={e => setEasydonateServerId(e.target.value)} placeholder="Например: 64336" className="w-full bg-white border border-orange-200 rounded-xl py-2 px-4 text-orange-950" />
            </div>
            <button onClick={handleSaveEasydonate} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-xl mt-4 w-full">
              Сохранить настройки API
            </button>
          </div>
        )}

        {activeTab === 'promo' && (
          <div>
            <div className="flex gap-4 mb-6 items-end flex-wrap">
              <div>
                <label className="block text-sm text-orange-800 mb-1">Кол-во использований</label>
                <input type="number" min="1" value={promoUses} onChange={e => setPromoUses(parseInt(e.target.value) || 1)} className="bg-white border border-orange-200 rounded-xl py-2 px-4 text-orange-950 w-32" />
              </div>
              <div>
                <label className="block text-sm text-orange-800 mb-1">Процент скидки (%)</label>
                <input type="number" min="0" max="100" value={promoPercentage} onChange={e => setPromoPercentage(parseInt(e.target.value) || 0)} className="bg-white border border-orange-200 rounded-xl py-2 px-4 text-orange-950 w-32" />
              </div>
              <button onClick={handleGeneratePromo} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-xl">
                Сгенерировать
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {promos.map(p => (
                <div key={p.id} className="bg-white p-4 rounded-xl border border-orange-200 flex flex-col justify-between items-start gap-2 relative group shadow-sm">
                  <div className="flex justify-between w-full items-center">
                    <span className="font-mono text-lg text-orange-950 font-bold">{p.code}</span>
                    <button 
                      onClick={() => handleDeletePromo(p.id)}
                      className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Удалить промокод"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex justify-between w-full">
                    <span className="text-sm text-orange-600">Использований: {p.uses_left}</span>
                    {p.percentage > 0 && <span className="text-sm text-green-600 font-bold">-{p.percentage}%</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-orange-800 border-b border-orange-200">
                  <th className="pb-3 font-medium">ID</th>
                  <th className="pb-3 font-medium">Никнейм</th>
                  <th className="pb-3 font-medium">Email</th>
                  <th className="pb-3 font-medium">Статус</th>
                  <th className="pb-3 font-medium">Дата регистрации</th>
                  <th className="pb-3 font-medium">Действия</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b border-orange-100/50">
                    <td className="py-3 text-orange-950">{u.id}</td>
                    <td className="py-3 text-orange-950 font-medium">{u.username}</td>
                    <td className="py-3 text-orange-600">{u.email}</td>
                    <td className="py-3">
                      {u.is_banned ? (
                        <span className="text-red-600 text-sm font-medium bg-red-50 border border-red-100 px-2 py-1 rounded-md">Забанен</span>
                      ) : (
                        <span className="text-green-600 text-sm font-medium bg-green-50 border border-green-100 px-2 py-1 rounded-md">Активен</span>
                      )}
                    </td>
                    <td className="py-3 text-orange-600">{new Date(u.created_at).toLocaleDateString()}</td>
                    <td className="py-3 relative flex gap-2">
                      <button 
                        onClick={() => setSelectedUserForGift(selectedUserForGift === u.id ? null : u.id)}
                        className="bg-orange-100 hover:bg-orange-200 text-orange-900 px-3 py-1 rounded-lg text-sm transition-colors"
                      >
                        Выдать товар
                      </button>
                      <button 
                        onClick={() => handleToggleBan(u.id, u.is_banned)}
                        className={`${u.is_banned ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'} px-3 py-1 rounded-lg text-sm transition-colors`}
                      >
                        {u.is_banned ? 'Разбанить' : 'Забанить'}
                      </button>
                      {selectedUserForGift === u.id && (
                        <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-orange-200 rounded-xl shadow-2xl z-50 p-2 flex flex-col gap-2">
                          <button className="text-left px-3 py-2 hover:bg-orange-50 rounded-lg text-orange-950 text-sm font-medium" onClick={() => {alert('Выдана привилегия'); setSelectedUserForGift(null)}}>SUPER (1 месяц)</button>
                          <button className="text-left px-3 py-2 hover:bg-orange-50 rounded-lg text-orange-950 text-sm font-medium" onClick={() => {alert('Выдана привилегия'); setSelectedUserForGift(null)}}>SUPER (3 месяца)</button>
                          <button className="text-left px-3 py-2 hover:bg-orange-50 rounded-lg text-orange-950 text-sm font-medium" onClick={() => {alert('Выдана привилегия'); setSelectedUserForGift(null)}}>SUPER (Навсегда)</button>
                          <button className="text-left px-3 py-2 hover:bg-amber-50 rounded-lg text-amber-600 text-sm font-bold" onClick={() => {alert('Выданы тикеты'); setSelectedUserForGift(null)}}>100 Тикетов</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default App
