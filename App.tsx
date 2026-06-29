import { useState, useEffect, useMemo } from 'react'
import { Search, Star, Ticket, User, X, Copy, Check, Settings, ShoppingBag, Flame, Shield, Database, Users, Gift, Activity, Moon, Sun, ChevronDown } from 'lucide-react'
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
      throw new Error(`Ошибка сервера: Неверный ответ от бэкенда. Возможно, сервер не запущен.`);
    }

    if (!response.ok) {
      // Пытаемся извлечь понятное сообщение об ошибке
      let errorMsg = data.error || data.message || 'Произошла неизвестная ошибка сервера';
      if (typeof errorMsg === 'object') {
        errorMsg = JSON.stringify(errorMsg);
      }
      throw new Error(errorMsg);
    }

    return data.result !== undefined ? data.result : data;
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
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return true; // Default dark
  });

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
  const [loggedInUser, setLoggedInUser] = useState<string | null>(() => {
    return localStorage.getItem('loggedInUser');
  });
  const [loggedInEmail, setLoggedInEmail] = useState<string | null>(() => {
    return localStorage.getItem('loggedInEmail');
  });
  
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null)
  const [selectedDuration, setSelectedDuration] = useState<any | null>(null)
  const [promoCode, setPromoCode] = useState('')
  const [ticketAmount, setTicketAmount] = useState<number>(100)
  
  const [copiedIp, setCopiedIp] = useState(false)
  const [onlineCount, setOnlineCount] = useState<string>('Загрузка...')
  const [openRuleIndex, setOpenRuleIndex] = useState<number | null>(null);

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      if (e.target instanceof HTMLImageElement) {
        e.preventDefault();
      }
    };
    const handleDragStart = (e: DragEvent) => {
      if (e.target instanceof HTMLImageElement) {
        e.preventDefault();
      }
    };
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('dragstart', handleDragStart);
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('dragstart', handleDragStart);
    };
  }, []);

  useEffect(() => {
    if (loggedInUser) {
      localStorage.setItem('loggedInUser', loggedInUser);
    } else {
      localStorage.removeItem('loggedInUser');
    }
  }, [loggedInUser]);

  useEffect(() => {
    if (loggedInEmail) {
      localStorage.setItem('loggedInEmail', loggedInEmail);
    } else {
      localStorage.removeItem('loggedInEmail');
    }
  }, [loggedInEmail]);

  useEffect(() => {
    setActiveTab(defaultTab)
  }, [defaultTab])

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode])

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
        setLoggedInUser(res.username || username);
        setLoggedInEmail(res.email || email);
        setAuthSuccess(res.msg || 'Регистрация успешна!')
        setTimeout(() => setIsAuthModalOpen(false), 1500)
      } else {
        const res: any = await customInvoke('login', { identifier: username, password })
        setLoggedInUser(res.username || username.split('@')[0])
        setLoggedInEmail(res.email)
        setAuthSuccess(res.msg || 'Вход выполнен успешно!')
        setTimeout(() => setIsAuthModalOpen(false), 1500)
      }
    } catch (err: any) {
      let errorMessage = 'Неизвестная ошибка';
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      } else if (err?.error) {
        errorMessage = err.error;
      }
      setAuthError(errorMessage);
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
      desc: 'Премиум валюта для покупки визуальных улучшений. 1 тикет = 1 рубль.',
      type: 'currency',
      prices: [],
      easydonateId: 1086831 // Укажите ID товара "1 тикет" из EasyDonate
    }
  ]

  const rulesData = [
    {
      title: '1. Основные правила',
      items: [
        '1.1 Зайдя на сервер, вы автоматически соглашаетесь с правилами сервера и несёте полную ответственность за свои действия.',
        '1.2 Незнание правил не освобождает от ответственности.',
        '1.3 Администрация имеет право заблокировать аккаунт или исключить из вайтлиста без объяснения причин.',
        '1.4 Правила могут быть изменены без предварительного уведомления игроков. Рекомендуется следить за обновлениями.'
      ]
    },
    {
      title: '2. Игровые правила',
      items: [
        '2.1 Запрещено гриферство, порча построек, воровство, обман, мошенничество, а также брать предметы без разрешения владельца.\nНаказание:\nНезначительное нарушение — варн.\nЗначительное — бан от 3 дней до перманентного.',
        '2.2 Запрещено использовать запрещённое ПО (xray, чит-клиенты, макросы, баритон, текстурпаки с просвечиванием и другие на усмотрение администрации).\nНаказание: бан от 7 дней до перманентного.',
        '2.3 Запрещено портить ландшафт сервера и строить непристойные или оскорбительные постройки в общественных местах.\nНаказание: Бан то 3 дней.',
        '2.4 Запрещено строиться ближе 500 блоков от спавна в любую сторону. Если нет министра то ближе чем в 50.\nНаказание: удаление построек + варн.',
        '2.5 Запрещена продажа, покупка, передача и использование чужих аккаунтов.\nНаказание: бан от 7 дней до перманентного.',
        '2.6 Запрещено создавать более одного твинк-аккаунта.\nНаказание: бан навсегда твинка + варн на основной аккаунт.',
        '2.7 Запрещён дюп любых предметов и использование уязвимостей сервера (кроме TNT, ковров, рельс, сыпучих блоков и крюков).\nНаказание: бан от 7 дней до перманентного.',
        '2.8 Запрещено распространять личную или конфиденциальную информацию других игроков без их согласия.\nНаказание: варн. При повторении — бан до 30 дней.',
        '2.9 Запрещено выдавать себя за администрацию или модераторов сервера, если вы ими не являетесь.\nНаказание: бан до 3 дней + варн.',
        '2.10 Запрещено использовать баги и ошибки сервера для получения преимущества (чёрный рынок, и т.п.).\nНаказание: бан от 7 дней до перманентного.',
        '2.11 Запрещено использовать оскорбительные или неприемлемые никнеймы, названия построек и организаций.\nНаказание: варн + просьба сменить. При отказе — бан перманентно.',
        '2.12 Запрещено мешать работе администрации и модераторов, а также препятствовать их действиям.\nНаказание: варн или бан до 3 дней.'
      ]
    },
    {
      title: '3. Правила чата',
      items: [
        '3.1 Запрещены любые формы оскорблений, унижений, травли и буллинга.\nНаказание:\nНезначительное нарушение — мут от 30 минут до 1 часа.\nЗначительное нарушение — мут до 24 часов или бан до 7 дней.',
        '3.3 Запрещено обсуждение политики, религии и других спорных тем, способных вызвать конфликты.\nНаказание: мут от 1 часа + варн.',
        '3.4 Запрещён спам, флуд, повторяющиеся сообщения и использование капса без необходимости.\nНаказание: мут 10 минут + варн.',
        '3.5 Запрещено публиковать ссылки на сторонние ресурсы без разрешения администрации.\nНаказание: мут 1 день + варн. При повторении — бан до 365 дней.',
        '3.6 Запрещено рекламировать другие сервера, проекты, сайты и сообщества.\nНаказание: перманентный бан',
        '3.7 Запрещено публиковать личную информацию других пользователей без их согласия.\nНаказание: варн. При повторении — бан до 7 дней.',
        '3.8 Запрещено провоцировать конфликты и разжигать междоусобицы.\nНаказание: мут от 30 минут до 24 часов + варн.',
        '3.9 Запрещено использовать никнеймы, аватары и статусы с оскорбительным, провокационным или неприемлемым содержанием.\nНаказание: варн + просьба сменить. При отказе — мут до 7 дней.',
        '3.10 Запрещено использовать чат для мошенничества, обмана или сбора личных данных.\nНаказание: перманентный бан.',
        '3.11 Запрещено использовать баги и ошибки чата для нарушения порядка.\nНаказание: варн или бан до 3 дней в зависимости от тяжести.',
        '3.12 Все жалобы и вопросы по работе сервера необходимо направлять в специальные каналы или напрямую администрации, а не устраивать публичные разборки.\nНаказание: варн. При повторении — мут до 1 часа.',
        '3.13 Запрещено использовать сторонние программы и боты для автоматизации сообщений или действий в чате.\nНаказание: перманентный бан',
        '3.14 Запрещено создавать массовые упоминания (@everyone, @here) без веской причины.\nНаказание: перманентный бан.'
      ]
    }
  ];

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
            <Search className="h-5 w-5 text-orange-400 dark:text-orange-500" />
          </div>
          <input
            type="text"
            name="global_search_dummy"
            autoComplete="off"
            placeholder="Поиск товаров..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              if (e.target.value.length > 0 && activeTab !== 'privileges') {
                setActiveTab('privileges')
              }
            }}
            className="w-full bg-white/60 dark:bg-dark-800/60 backdrop-blur-md border border-orange-200 dark:border-dark-700 rounded-2xl py-3 pl-12 pr-4 text-orange-950 dark:text-white placeholder-orange-400 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all shadow-lg"
          />
        </div>

        <div className="flex items-center gap-4 ml-auto flex-wrap justify-center">
          <div className="flex gap-2 bg-white/80 dark:bg-dark-900/80 backdrop-blur-md p-1.5 rounded-2xl border border-orange-200 dark:border-dark-800 shadow-xl overflow-x-auto max-w-[100vw]">
            <button
              onClick={() => setActiveTab('main')}
              className={`px-3 py-2 md:px-5 md:py-2.5 rounded-xl font-medium transition-all duration-300 whitespace-nowrap ${
                activeTab === 'main' 
                  ? 'bg-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.4)]' 
                  : 'text-orange-600 hover:text-orange-900 hover:bg-orange-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-dark-800'
              }`}
            >
              Главная
            </button>
            <button
              onClick={() => setActiveTab('privileges')}
              className={`px-3 py-2 md:px-5 md:py-2.5 rounded-xl font-medium transition-all duration-300 whitespace-nowrap ${
                activeTab === 'privileges' 
                  ? 'bg-amber-400 text-orange-950 shadow-[0_0_15px_rgba(250,204,21,0.4)]' 
                  : 'text-orange-600 hover:text-orange-900 hover:bg-orange-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-dark-800'
              }`}
            >
              Магазин
            </button>
            <button
              onClick={() => setActiveTab('rules')}
              className={`px-3 py-2 md:px-5 md:py-2.5 rounded-xl font-medium transition-all duration-300 whitespace-nowrap ${
                activeTab === 'rules' 
                  ? 'bg-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.4)]' 
                  : 'text-orange-600 hover:text-orange-900 hover:bg-orange-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-dark-800'
              }`}
            >
              Правила
            </button>
            <button
              onClick={() => setActiveTab('staff')}
              className={`px-3 py-2 md:px-5 md:py-2.5 rounded-xl font-medium transition-all duration-300 whitespace-nowrap ${
                activeTab === 'staff' 
                  ? 'bg-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.4)]' 
                  : 'text-orange-600 hover:text-orange-900 hover:bg-orange-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-dark-800'
              }`}
            >
              Состав
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
                  : 'bg-white/80 dark:bg-dark-800/80 text-orange-950 dark:text-white border border-orange-300 dark:border-dark-700 hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-dark-700'
              }`}
            >
              <User className={`w-5 h-5 ${activeTab === 'profile' ? 'text-white' : 'text-orange-500'}`} />
              <span className="hidden md:inline font-medium">{loggedInUser}</span>
            </button>
          ) : (
            <button 
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center justify-center gap-2 bg-white/80 dark:bg-dark-800/80 hover:bg-orange-50 dark:hover:bg-dark-700 text-orange-950 dark:text-white border border-orange-200 dark:border-dark-700 hover:border-orange-500/50 transition-all duration-300 p-2.5 md:px-4 md:py-2.5 rounded-2xl shadow-xl"
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
                <h2 className="text-3xl md:text-4xl font-bold text-orange-950 dark:text-white">
                  Ваш любимый сервер Minecraft
                </h2>
                <p className="text-xl text-orange-800 dark:text-gray-300 leading-relaxed">
                  Погрузитесь в мир ванильного выживания с улучшенными механиками, 
                  отзывчивой администрацией и дружным комьюнити. Без приватов, 
                  без доната, влияющего на баланс!
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 mt-4 items-center md:items-start">
                  <div className="flex flex-col gap-2">
                    <span className="text-orange-600 dark:text-orange-400 font-medium">Версия: <span className="text-orange-950 dark:text-white">1.21.11</span></span>
                    <span className="text-orange-600 dark:text-orange-400 font-medium">Онлайн: <span className="text-green-600 font-bold">{onlineCount}</span></span>
                  </div>
                  
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText('hotland.gamepvp.ru');
                      setCopiedIp(true);
                      setTimeout(() => setCopiedIp(false), 2000);
                    }}
                    className="sm:ml-auto relative group overflow-hidden rounded-2xl bg-white dark:bg-dark-800 border-2 border-orange-400 dark:border-dark-700 hover:border-orange-500 dark:hover:border-orange-500 px-8 py-4 transition-all duration-300 shadow-xl hover:shadow-2xl"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-100 to-amber-100 dark:from-dark-700 dark:to-dark-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative flex items-center gap-3 font-bold text-orange-950 dark:text-white">
                      {copiedIp ? <Check className="text-green-500" /> : <Copy className="text-orange-500" />}
                      {copiedIp ? 'Скопировано!' : 'hotland.gamepvp.ru'}
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
                  <div className="w-full h-full rounded-[3rem] shadow-[0_20px_50px_rgba(249,115,22,0.3)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center justify-center border-[3px] border-white dark:border-dark-700 overflow-hidden relative bg-white dark:bg-dark-800 rotate-3 group hover:rotate-0 transition-transform duration-500">
                    <img 
                      src="/logo.png" 
                      alt="Hero Logo" 
                      className="w-[102%] h-[102%] object-cover absolute z-10" 
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
                    className="absolute z-10 w-12 h-12 bg-amber-400 border-[3px] border-amber-500 shadow-[0_10px_20px_rgba(250,204,21,0.4)] rounded-2xl flex items-center justify-center"
                    style={{
                      left: `${20 + i * 15}%`,
                      top: `${10 + (i % 3) * 30}%`
                    }}
                  >
                    <div className="w-4 h-4 bg-amber-300 rounded-md" />
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'profile' && loggedInUser && (
            <div className="max-w-4xl mx-auto">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-8 bg-white/80 dark:bg-dark-900/80 backdrop-blur-md border border-orange-200 dark:border-dark-800 p-8 rounded-3xl shadow-xl mb-8">
                <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center flex-shrink-0 shadow-[0_10px_20px_rgba(249,115,22,0.3)]">
                  <User className="w-16 h-16 text-white" />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-4xl font-bold text-orange-950 dark:text-white mb-2">{loggedInUser}</h2>
                  <p className="text-orange-600 dark:text-gray-400 mb-6">Пользователь HotLandSITE</p>
                  <div className="flex flex-wrap justify-center md:justify-start gap-4">
                    <button 
                      onClick={() => setActiveTab('settings')}
                      className="flex items-center gap-2 bg-orange-50 dark:bg-dark-800 hover:bg-orange-100 dark:hover:bg-dark-700 text-orange-950 dark:text-white px-5 py-2.5 rounded-xl transition-colors font-medium border border-orange-200 dark:border-dark-700"
                    >
                      <Settings className="w-5 h-5" />
                      Настройки
                    </button>
                    <button 
                      onClick={() => {
                        setLoggedInUser(null);
                        setActiveTab('main');
                      }}
                      className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 border border-red-200 dark:border-red-800/50 px-5 py-2.5 rounded-xl transition-colors font-medium"
                    >
                      Выйти
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && loggedInUser && (
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold mb-8 text-orange-950 dark:text-white flex items-center gap-3">
                <Settings className="text-orange-500" /> 
                Настройки профиля
              </h2>
              <div className="bg-white/80 dark:bg-dark-900/80 backdrop-blur-md border border-orange-200 dark:border-dark-800 p-8 rounded-3xl shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-orange-950 dark:text-white">Тёмная тема</h3>
                    <p className="text-orange-600 dark:text-gray-400">Включить красивый темный дизайн</p>
                  </div>
                  <button 
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    className={`w-14 h-8 rounded-full transition-colors relative ${isDarkMode ? 'bg-orange-500' : 'bg-gray-300 dark:bg-dark-700'}`}
                  >
                    <div className={`absolute top-1 left-1 bg-white w-6 h-6 rounded-full transition-transform flex items-center justify-center ${isDarkMode ? 'translate-x-6' : 'translate-x-0'}`}>
                      {isDarkMode ? <Moon className="w-4 h-4 text-orange-500" /> : <Sun className="w-4 h-4 text-orange-500" />}
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'rules' && (
            <div className="max-w-5xl mx-auto space-y-4">
              <h2 className="text-4xl font-bold text-orange-950 dark:text-white mb-10 text-center flex items-center justify-center gap-3">
                <Shield className="w-10 h-10 text-orange-500" /> 
                Правила проекта
              </h2>
              {rulesData.map((category, idx) => (
                <div key={idx} className="bg-white/80 dark:bg-[#111] backdrop-blur-md rounded-2xl overflow-hidden shadow-lg border-t-4 border-t-orange-500 border-x border-b border-orange-200 dark:border-[#222]">
                  <button 
                    onClick={() => setOpenRuleIndex(openRuleIndex === idx ? null : idx)}
                    className="w-full flex items-center justify-between p-6 text-left hover:bg-orange-50/50 dark:hover:bg-white/5 transition-colors"
                  >
                    <span className="text-xl font-bold text-orange-950 dark:text-white">{category.title}</span>
                    <div className="flex items-center gap-2 text-sm text-orange-500 dark:text-gray-400 font-medium">
                      Развернуть
                      <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${openRuleIndex === idx ? 'rotate-180' : ''}`} />
                    </div>
                  </button>
                  <AnimatePresence>
                    {openRuleIndex === idx && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="p-6 pt-0 space-y-4 border-t border-orange-100 dark:border-white/10 mt-2">
                          {category.items.map((item, itemIdx) => (
                            <div key={itemIdx} className="bg-orange-50/50 dark:bg-black/50 p-4 rounded-xl border border-orange-100 dark:border-white/5">
                              <p className="text-orange-900 dark:text-gray-300 whitespace-pre-wrap leading-relaxed text-sm md:text-base">
                                {item}
                              </p>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'staff' && (
            <div className="max-w-4xl mx-auto bg-white/80 dark:bg-dark-900/80 backdrop-blur-md border border-orange-200 dark:border-dark-800 p-8 rounded-3xl shadow-xl text-center">
              <Users className="w-16 h-16 text-orange-500 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-orange-950 dark:text-white mb-4">Состав администрации</h2>
              <p className="text-orange-800 dark:text-gray-300 text-lg">
                Здесь скоро появится список команды проекта. Пожалуйста, загляните позже!
              </p>
            </div>
          )}

          {activeTab === 'admin' && loggedInUser === 'ADMIN' && (
            <AdminPanel />
          )}

          {activeTab === 'privileges' && (
            <div className="pb-20">
              <h2 className="text-3xl font-bold mb-12 text-orange-950 dark:text-white flex items-center gap-3">
                <Star className="text-orange-500" /> 
                Привилегии и Товары
              </h2>
              {filteredPrivileges.length === 0 ? (
                <p className="text-orange-600 dark:text-gray-400 text-center py-10 text-xl">Ничего не найдено :(</p>
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
                      className="bg-white/80 dark:bg-dark-900/80 backdrop-blur-md border border-orange-200 dark:border-dark-800 rounded-3xl p-6 flex flex-col items-center text-center hover:border-orange-400 dark:hover:border-orange-500 transition-all duration-300 shadow-xl cursor-pointer"
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
                      
                      <h3 className="text-2xl font-bold text-orange-950 dark:text-white mb-2 mt-6">{item.name}</h3>
                      <p className="text-orange-800 dark:text-gray-400 mb-6">{item.desc}</p>
                      
                      <button className={`w-full ${item.type === 'super' ? 'bg-green-500 hover:bg-green-600 shadow-[0_5px_15px_rgba(34,197,94,0.3)]' : 'bg-orange-500 hover:bg-orange-600 shadow-[0_5px_15px_rgba(249,115,22,0.3)]'} text-white font-bold py-3 px-6 rounded-xl transition-colors`}>
                        Купить от {item.prices[0].price}
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}

              <h2 className="text-3xl font-bold mb-12 mt-16 text-orange-950 dark:text-white flex items-center gap-3">
                <Ticket className="text-amber-500" /> 
                Игровая валюта
              </h2>
              {filteredCurrencies.length === 0 ? (
                <p className="text-orange-600 dark:text-gray-400 text-center py-10 text-xl">Ничего не найдено :(</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredCurrencies.map(item => (
                    <motion.div 
                      key={item.id}
                      whileHover={{ scale: 1.05, y: -5 }}
                      onClick={() => {
                        setSelectedProduct(item);
                      }}
                      className="bg-white/80 dark:bg-dark-900/80 backdrop-blur-md border border-amber-200 dark:border-dark-800 rounded-3xl p-6 flex flex-col items-center text-center hover:border-amber-400 dark:hover:border-amber-500 transition-all duration-300 shadow-xl cursor-pointer"
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
                      
                      <h3 className="text-2xl font-bold text-orange-950 dark:text-white mb-2 mt-6">{item.name}</h3>
                      <p className="text-amber-700 dark:text-amber-500 mb-6 font-medium">{item.desc}</p>
                      
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

      <footer className="relative z-10 bg-white/60 dark:bg-dark-900/60 backdrop-blur-md border-t border-orange-200 dark:border-dark-800 mt-10">
        <div className="max-w-7xl mx-auto p-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col items-center md:items-start gap-4">
            <Logo />
            <p className="text-orange-800 dark:text-gray-400 font-medium text-center md:text-left max-w-sm">
              Лучший ванильный сервер Minecraft. Играй, развивайся, общайся.
            </p>
          </div>
          
          <div className="transform hover:scale-105 transition-transform duration-300 drop-shadow-xl hover:drop-shadow-2xl flex items-center justify-center bg-orange-500 p-4 rounded-[2rem]">
            <img src="/discord_qr.png" alt="Discord QR" className="w-48 h-auto object-contain rounded-xl" onError={(e) => {
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
              className="relative w-full max-w-lg bg-white dark:bg-dark-900 border border-orange-200 dark:border-dark-700 shadow-2xl rounded-3xl overflow-hidden"
            >
              <div className="p-6 border-b border-orange-100 dark:border-dark-800 flex justify-between items-center bg-orange-50/50 dark:bg-dark-800/50">
                <h3 className="text-2xl font-bold text-orange-950 dark:text-white">
                  Покупка
                </h3>
                <button 
                  onClick={() => {
                    setSelectedProduct(null);
                    setPromoCode('');
                  }}
                  className="text-orange-400 dark:text-gray-400 hover:text-orange-600 dark:hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6">
                <div className="flex flex-col items-center mb-6">
                  <h3 className="text-3xl font-bold text-orange-950 dark:text-white mb-2">{selectedProduct.name}</h3>
                  <p className="text-orange-600 dark:text-gray-400 text-center">{selectedProduct.desc}</p>
                </div>

                <div className="space-y-4">
                  {selectedProduct.type === 'currency' ? (
                    <div>
                      <label className="block text-sm font-medium text-orange-800 dark:text-gray-300 mb-1.5">Количество (1 тикет = 1₽)</label>
                      <input 
                        type="number" 
                        min="1"
                        value={ticketAmount}
                        onChange={(e) => setTicketAmount(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full bg-orange-50 dark:bg-dark-800 border border-orange-200 dark:border-dark-700 rounded-xl py-3 px-4 text-orange-950 dark:text-white placeholder-orange-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all"
                      />
                    </div>
                  ) : (
                    selectedProduct.prices?.length > 1 && (
                      <div>
                        <label className="block text-sm font-medium text-orange-800 dark:text-gray-300 mb-1.5">Срок действия</label>
                        <div className="grid grid-cols-3 gap-2">
                          {selectedProduct.prices.map((p: any) => (
                            <button
                              key={p.duration}
                              onClick={() => setSelectedDuration(p)}
                              className={`py-2 px-3 rounded-xl border text-sm font-medium transition-all ${selectedDuration?.duration === p.duration ? 'bg-orange-100 dark:bg-orange-900/30 border-orange-500 text-orange-800 dark:text-orange-400' : 'bg-white dark:bg-dark-800 border-orange-200 dark:border-dark-700 text-orange-600 dark:text-gray-400 hover:border-orange-400 dark:hover:border-gray-500'}`}
                            >
                              {p.duration}
                            </button>
                          ))}
                        </div>
                      </div>
                    )
                  )}

                  <div>
                    <label className="block text-sm font-medium text-orange-800 dark:text-gray-300 mb-1.5">Никнейм на сервере</label>
                    <input 
                      type="text" 
                      defaultValue={loggedInUser || ''}
                      placeholder="Ваш никнейм"
                      className="w-full bg-orange-50 dark:bg-dark-800 border border-orange-200 dark:border-dark-700 rounded-xl py-3 px-4 text-orange-950 dark:text-white placeholder-orange-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-orange-800 dark:text-gray-300 mb-1.5">Промокод (если есть)</label>
                    <input 
                      type="text" 
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      placeholder="PROMO2024"
                      className="w-full bg-orange-50 dark:bg-dark-800 border border-orange-200 dark:border-dark-700 rounded-xl py-3 px-4 text-orange-950 dark:text-white placeholder-orange-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all uppercase"
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
              className="relative w-full max-w-md bg-white dark:bg-dark-900 border border-orange-200 dark:border-dark-700 shadow-2xl rounded-3xl overflow-hidden"
            >
              <div className="p-6 border-b border-orange-100 dark:border-dark-800 flex justify-between items-center bg-orange-50/50 dark:bg-dark-800/50">
                <h3 className="text-2xl font-bold text-orange-950 dark:text-white">
                  {authMode === 'login' ? 'Вход в аккаунт' : 'Регистрация'}
                </h3>
                <button 
                  onClick={() => setIsAuthModalOpen(false)}
                  className="text-orange-400 dark:text-gray-400 hover:text-orange-600 dark:hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6">
                <form className="space-y-4" onSubmit={handleAuth}>
                  {authError && (
                    <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm text-center">
                      {authError}
                    </div>
                  )}
                  {authSuccess && (
                    <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 p-3 rounded-xl text-sm text-center">
                      {authSuccess}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-orange-800 dark:text-gray-300 mb-1.5">
                      {authMode === 'login' ? 'Никнейм или Email' : 'Никнейм'}
                    </label>
                    <input 
                      type="text" 
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder={authMode === 'login' ? 'player1 или email@example.com' : 'Ваш ник на сервере'}
                      className="w-full bg-orange-50 dark:bg-dark-800 border border-orange-200 dark:border-dark-700 rounded-xl py-3 px-4 text-orange-950 dark:text-white placeholder-orange-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
                    />
                  </div>

                  {authMode === 'register' && (
                    <div>
                      <label className="block text-sm font-medium text-orange-800 dark:text-gray-300 mb-1.5">Email</label>
                      <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Ваш email адрес"
                        className="w-full bg-orange-50 dark:bg-dark-800 border border-orange-200 dark:border-dark-700 rounded-xl py-3 px-4 text-orange-950 dark:text-white placeholder-orange-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
                      />
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-orange-800 dark:text-gray-300 mb-1.5">Пароль</label>
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-orange-50 dark:bg-dark-800 border border-orange-200 dark:border-dark-700 rounded-xl py-3 px-4 text-orange-950 dark:text-white placeholder-orange-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
                    />
                  </div>

                  {authMode === 'register' && (
                    <div>
                      <label className="block text-sm font-medium text-orange-800 dark:text-gray-300 mb-1.5">Повторите пароль</label>
                      <input 
                        type="password" 
                        value={repeatPassword}
                        onChange={(e) => setRepeatPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-orange-50 dark:bg-dark-800 border border-orange-200 dark:border-dark-700 rounded-xl py-3 px-4 text-orange-950 dark:text-white placeholder-orange-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
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
                  <p className="text-orange-600 dark:text-gray-400 text-sm">
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
  const [globalDiscounts, setGlobalDiscounts] = useState<any[]>([]);
  const [promoPercentage, setPromoPercentage] = useState<number>(0);
  const [promoUses, setPromoUses] = useState<number>(1);
  const [promoExpiresAt, setPromoExpiresAt] = useState<string>('');
  
  const [gdName, setGdName] = useState<string>('');
  const [gdPercentage, setGdPercentage] = useState<number>(0);
  const [gdExpiresAt, setGdExpiresAt] = useState<string>('');

  const [selectedUserForGift, setSelectedUserForGift] = useState<any>(null);
  const [chartPeriod, setChartPeriod] = useState<'1d' | '3d' | '7d'>('1d');
  const [chartType, setChartType] = useState<'load' | 'purchases' | 'traffic'>('load');

  const loadPoints = useMemo(() => {
    let dataLength = 12;
    if (chartPeriod === '3d') dataLength = 36;
    if (chartPeriod === '7d') dataLength = 84;

    const data = Array.from({ length: dataLength }, () => Math.floor(Math.random() * 100) + 40);
    return data.map((y, i) => {
      const x = (i * (800 / (dataLength - 1))).toFixed(1);
      const variedY = (y + (Math.random() * 20 - 10)).toFixed(1);
      return `${x},${variedY}`;
    }).join(' ');
  }, [chartPeriod]);

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

  const fetchGlobalDiscounts = async () => {
    try {
      const res = await customInvoke('get_global_discounts');
      setGlobalDiscounts(res);
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
    fetchGlobalDiscounts();
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
      const payload: any = { uses: promoUses, percentage: promoPercentage };
      if (promoExpiresAt) payload.expires_at = new Date(promoExpiresAt).toISOString();
      await customInvoke('generate_promocode', payload);
      fetchPromos();
    } catch (e) { alert(e); }
  };

  const handleDeletePromo = async (id: number) => {
    try {
      await customInvoke('delete_promocode', { id });
      fetchPromos();
    } catch (e) { alert(e); }
  };

  const handleAddGlobalDiscount = async () => {
    try {
      const payload: any = { name: gdName || 'Скидка', percentage: gdPercentage };
      if (gdExpiresAt) payload.expires_at = new Date(gdExpiresAt).toISOString();
      await customInvoke('add_global_discount', payload);
      fetchGlobalDiscounts();
    } catch (e) { alert(e); }
  };

  const handleDeleteGlobalDiscount = async (id: number) => {
    try {
      await customInvoke('delete_global_discount', { id });
      fetchGlobalDiscounts();
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
    <div className="max-w-6xl mx-auto bg-white/80 dark:bg-dark-900/80 backdrop-blur-md border border-orange-200 dark:border-dark-800 rounded-3xl p-8 shadow-xl">
      <h2 className="text-3xl font-bold text-orange-950 dark:text-white mb-8 flex items-center gap-3">
        <Shield className="text-red-500" /> Панель Администратора
      </h2>
      
      <div className="flex gap-4 mb-8 border-b border-orange-100 dark:border-dark-800 pb-4 overflow-x-auto">
        {[
          { id: 'stats', name: 'Статистика', icon: Activity },
          { id: 'rcon', name: 'RCON', icon: Database },
          { id: 'easydonate', name: 'EasyDonate', icon: ShoppingBag },
          { id: 'promo', name: 'Промокоды', icon: Gift },
          { id: 'global_discounts', name: 'Глобальные скидки', icon: Star },
          { id: 'users', name: 'Пользователи', icon: Users }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${activeTab === t.id ? 'bg-red-500 text-white' : 'bg-orange-50 dark:bg-dark-800 text-orange-600 dark:text-gray-300 hover:bg-orange-100 dark:hover:bg-dark-700'}`}
          >
            <t.icon className="w-4 h-4" />
            {t.name}
          </button>
        ))}
      </div>

      <div>
        {activeTab === 'stats' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-orange-50 dark:bg-dark-800 p-6 rounded-2xl border border-orange-100 dark:border-dark-700">
              <h3 className="text-orange-600 dark:text-gray-400 mb-2">Всего пользователей</h3>
              <p className="text-4xl font-bold text-orange-950 dark:text-white">{stats.users}</p>
            </div>
            <div className="bg-orange-50 dark:bg-dark-800 p-6 rounded-2xl border border-orange-100 dark:border-dark-700">
              <h3 className="text-orange-600 dark:text-gray-400 mb-2">Всего покупок</h3>
              <p className="text-4xl font-bold text-orange-950 dark:text-white">{stats.purchases}</p>
            </div>
            <div className="col-span-1 md:col-span-2 bg-orange-50 dark:bg-dark-800 p-6 rounded-2xl border border-orange-100 dark:border-dark-700">
              <div className="flex justify-between items-center mb-6">
                <select 
                  value={chartType} 
                  onChange={(e) => setChartType(e.target.value as any)}
                  className="bg-transparent text-orange-600 dark:text-gray-400 font-medium text-lg focus:outline-none cursor-pointer border-b border-orange-200 dark:border-dark-700 pb-1"
                >
                  <option value="load">Нагрузка на сайт</option>
                  <option value="purchases">Покупки</option>
                  <option value="traffic">Посещаемость</option>
                </select>
                <div className="flex gap-2 bg-white dark:bg-dark-900 p-1 rounded-lg border border-orange-200 dark:border-dark-700">
                  <button onClick={() => setChartPeriod('1d')} className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${chartPeriod === '1d' ? 'bg-orange-100 dark:bg-dark-700 text-orange-950 dark:text-white' : 'text-orange-600 dark:text-gray-400 hover:bg-orange-50 dark:hover:bg-dark-800'}`}>1 день</button>
                  <button onClick={() => setChartPeriod('3d')} className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${chartPeriod === '3d' ? 'bg-orange-100 dark:bg-dark-700 text-orange-950 dark:text-white' : 'text-orange-600 dark:text-gray-400 hover:bg-orange-50 dark:hover:bg-dark-800'}`}>3 дня</button>
                  <button onClick={() => setChartPeriod('7d')} className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${chartPeriod === '7d' ? 'bg-orange-100 dark:bg-dark-700 text-orange-950 dark:text-white' : 'text-orange-600 dark:text-gray-400 hover:bg-orange-50 dark:hover:bg-dark-800'}`}>7 дней</button>
                </div>
              </div>
              <div className="relative w-full h-48">
                <svg viewBox="0 0 800 200" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                  {/* Grid lines */}
                  <line x1="0" y1="200" x2="800" y2="200" stroke="currentColor" className="text-orange-200 dark:text-dark-700" strokeWidth="2" />
                  <line x1="0" y1="100" x2="800" y2="100" stroke="currentColor" className="text-orange-200 dark:text-dark-700" strokeWidth="1" strokeDasharray="4 4" />
                  <line x1="0" y1="0" x2="800" y2="0" stroke="currentColor" className="text-orange-200 dark:text-dark-700" strokeWidth="1" strokeDasharray="4 4" />
                  
                  <defs>
                    <linearGradient id="loadGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f97316" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  
                  <motion.polygon 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1, delay: 0.5 }}
                    points={`0,200 ${loadPoints} 800,200`} 
                    fill="url(#loadGradient)" 
                  />
                  
                  <motion.polyline
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                    fill="none"
                    stroke="#f97316"
                    strokeWidth="4"
                    points={loadPoints}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    className="drop-shadow-md"
                  />
                </svg>
                <div className="flex justify-between mt-2 text-xs text-orange-400 dark:text-gray-500 font-medium">
                  <span>{chartPeriod === '1d' ? '24ч назад' : chartPeriod === '3d' ? '3 дня назад' : '7 дней назад'}</span>
                  <span>{chartPeriod === '1d' ? '12ч назад' : chartPeriod === '3d' ? '1.5 дня назад' : '3.5 дня назад'}</span>
                  <span>Сейчас</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'rcon' && (
          <div className="max-w-md space-y-4">
            <div>
              <label className="block text-sm text-orange-800 dark:text-gray-300 mb-1">Хост</label>
              <input type="text" value={rconHost} onChange={e => setRconHost(e.target.value)} className="w-full bg-white dark:bg-dark-800 border border-orange-200 dark:border-dark-700 rounded-xl py-2 px-4 text-orange-950 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm text-orange-800 dark:text-gray-300 mb-1">Порт</label>
              <input type="text" value={rconPort} onChange={e => setRconPort(e.target.value)} className="w-full bg-white dark:bg-dark-800 border border-orange-200 dark:border-dark-700 rounded-xl py-2 px-4 text-orange-950 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm text-orange-800 dark:text-gray-300 mb-1">Пароль</label>
              <input type="password" value={rconPassword} onChange={e => setRconPassword(e.target.value)} className="w-full bg-white dark:bg-dark-800 border border-orange-200 dark:border-dark-700 rounded-xl py-2 px-4 text-orange-950 dark:text-white" />
            </div>
            <button onClick={handleSaveRcon} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-xl mt-4 w-full">
              Сохранить настройки
            </button>
            <div className="mt-8 p-4 bg-orange-50 dark:bg-dark-800 border border-orange-200 dark:border-dark-700 rounded-xl">
              <h3 className="text-orange-800 dark:text-gray-400 text-sm mb-2">Статус RCON соединения:</h3>
              <p className={`font-medium ${rconStatus.includes('Ошибка') ? 'text-red-500' : 'text-green-600'}`}>
                {rconStatus}
              </p>
            </div>
          </div>
        )}

        {activeTab === 'easydonate' && (
          <div className="max-w-md space-y-4">
            <div className="bg-orange-50 dark:bg-dark-800 p-4 rounded-xl border border-orange-200 dark:border-dark-700 mb-6">
              <h3 className="text-orange-950 dark:text-white font-medium mb-2">Настройка интеграции</h3>
              <p className="text-orange-600 dark:text-gray-400 text-sm">
                Shop-Key можно найти в панели EasyDonate в разделе "Настройки API".<br/>
                Server ID можно найти в разделе "Серверы" (числовой идентификатор).
              </p>
            </div>
            <div>
              <label className="block text-sm text-orange-800 dark:text-gray-300 mb-1">Shop-Key</label>
              <input type="password" value={easydonateKey} onChange={e => setEasydonateKey(e.target.value)} placeholder="Ваш Shop-Key" className="w-full bg-white dark:bg-dark-800 border border-orange-200 dark:border-dark-700 rounded-xl py-2 px-4 text-orange-950 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm text-orange-800 dark:text-gray-300 mb-1">Server ID</label>
              <input type="text" value={easydonateServerId} onChange={e => setEasydonateServerId(e.target.value)} placeholder="Например: 64336" className="w-full bg-white dark:bg-dark-800 border border-orange-200 dark:border-dark-700 rounded-xl py-2 px-4 text-orange-950 dark:text-white" />
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
                <label className="block text-sm text-orange-800 dark:text-gray-300 mb-1">Кол-во использований</label>
                <input type="number" min="1" value={promoUses} onChange={e => setPromoUses(parseInt(e.target.value) || 1)} className="bg-white dark:bg-dark-800 border border-orange-200 dark:border-dark-700 rounded-xl py-2 px-4 text-orange-950 dark:text-white w-32" />
              </div>
              <div>
                <label className="block text-sm text-orange-800 dark:text-gray-300 mb-1">Процент скидки (%)</label>
                <input type="number" min="0" max="100" value={promoPercentage} onChange={e => setPromoPercentage(parseInt(e.target.value) || 0)} className="bg-white dark:bg-dark-800 border border-orange-200 dark:border-dark-700 rounded-xl py-2 px-4 text-orange-950 dark:text-white w-32" />
              </div>
              <div>
                <label className="block text-sm text-orange-800 dark:text-gray-300 mb-1">Срок действия (необяз.)</label>
                <input type="datetime-local" value={promoExpiresAt} onChange={e => setPromoExpiresAt(e.target.value)} className="bg-white dark:bg-dark-800 border border-orange-200 dark:border-dark-700 rounded-xl py-2 px-4 text-orange-950 dark:text-white" />
              </div>
              <button onClick={handleGeneratePromo} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-xl">
                Сгенерировать
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {promos.map(p => (
                <div key={p.id} className="bg-white dark:bg-dark-800 p-4 rounded-xl border border-orange-200 dark:border-dark-700 flex flex-col justify-between items-start gap-2 relative group shadow-sm">
                  <div className="flex justify-between w-full items-center">
                    <span className="font-mono text-lg text-orange-950 dark:text-white font-bold">{p.code}</span>
                    <button 
                      onClick={() => handleDeletePromo(p.id)}
                      className="text-gray-400 dark:text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Удалить промокод"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex justify-between w-full">
                    <span className="text-sm text-orange-600 dark:text-gray-400">Использований: {p.uses_left}</span>
                    {p.percentage > 0 && <span className="text-sm text-green-600 font-bold">-{p.percentage}%</span>}
                  </div>
                  {p.expires_at && (
                    <div className="text-xs text-orange-500 dark:text-gray-500 mt-1">
                      До: {new Date(p.expires_at).toLocaleString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'global_discounts' && (
          <div>
            <div className="flex gap-4 mb-6 items-end flex-wrap">
              <div>
                <label className="block text-sm text-orange-800 dark:text-gray-300 mb-1">Название</label>
                <input type="text" value={gdName} onChange={e => setGdName(e.target.value)} placeholder="Летняя распродажа" className="bg-white dark:bg-dark-800 border border-orange-200 dark:border-dark-700 rounded-xl py-2 px-4 text-orange-950 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm text-orange-800 dark:text-gray-300 mb-1">Скидка (%)</label>
                <input type="number" min="0" max="100" value={gdPercentage} onChange={e => setGdPercentage(parseInt(e.target.value) || 0)} className="bg-white dark:bg-dark-800 border border-orange-200 dark:border-dark-700 rounded-xl py-2 px-4 text-orange-950 dark:text-white w-32" />
              </div>
              <div>
                <label className="block text-sm text-orange-800 dark:text-gray-300 mb-1">Срок действия (необяз.)</label>
                <input type="datetime-local" value={gdExpiresAt} onChange={e => setGdExpiresAt(e.target.value)} className="bg-white dark:bg-dark-800 border border-orange-200 dark:border-dark-700 rounded-xl py-2 px-4 text-orange-950 dark:text-white" />
              </div>
              <button onClick={handleAddGlobalDiscount} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-xl">
                Добавить
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {globalDiscounts.map(gd => (
                <div key={gd.id} className="bg-white dark:bg-dark-800 p-4 rounded-xl border border-orange-200 dark:border-dark-700 flex flex-col justify-between items-start gap-2 relative group shadow-sm">
                  <div className="flex justify-between w-full items-center">
                    <span className="font-medium text-lg text-orange-950 dark:text-white">{gd.name}</span>
                    <button 
                      onClick={() => handleDeleteGlobalDiscount(gd.id)}
                      className="text-gray-400 dark:text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Удалить скидку"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex justify-between w-full">
                    <span className="text-sm text-orange-600 dark:text-gray-400">Глобальная скидка</span>
                    {gd.percentage > 0 && <span className="text-sm text-green-600 font-bold">-{gd.percentage}%</span>}
                  </div>
                  {gd.expires_at && (
                    <div className="text-xs text-orange-500 dark:text-gray-500 mt-1">
                      До: {new Date(gd.expires_at).toLocaleString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-orange-800 dark:text-gray-300 border-b border-orange-200 dark:border-dark-700">
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
                  <tr key={u.id} className="border-b border-orange-100/50 dark:border-dark-800/50">
                    <td className="py-3 text-orange-950 dark:text-gray-400">{u.id}</td>
                    <td className="py-3 text-orange-950 dark:text-white font-medium">{u.username}</td>
                    <td className="py-3 text-orange-600 dark:text-gray-400">{u.email}</td>
                    <td className="py-3">
                      {u.is_banned ? (
                        <span className="text-red-600 dark:text-red-400 text-sm font-medium bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800/50 px-2 py-1 rounded-md">Забанен</span>
                      ) : (
                        <span className="text-green-600 dark:text-green-400 text-sm font-medium bg-green-50 dark:bg-green-900/30 border border-green-100 dark:border-green-800/50 px-2 py-1 rounded-md">Активен</span>
                      )}
                    </td>
                    <td className="py-3 text-orange-600 dark:text-gray-400">{new Date(u.created_at).toLocaleDateString()}</td>
                    <td className="py-3 relative flex gap-2">
                      <button 
                        onClick={() => setSelectedUserForGift(selectedUserForGift === u.id ? null : u.id)}
                        className="bg-orange-100 dark:bg-dark-800 hover:bg-orange-200 dark:hover:bg-dark-700 text-orange-900 dark:text-gray-300 px-3 py-1 rounded-lg text-sm transition-colors border border-transparent dark:border-dark-700"
                      >
                        Выдать товар
                      </button>
                      <button 
                        onClick={() => handleToggleBan(u.id, u.is_banned)}
                        className={`${u.is_banned ? 'bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 text-gray-700 dark:text-gray-300' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 border border-red-200 dark:border-red-800/50'} px-3 py-1 rounded-lg text-sm transition-colors`}
                      >
                        {u.is_banned ? 'Разбанить' : 'Забанить'}
                      </button>
                      {selectedUserForGift === u.id && (
                        <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-dark-800 border border-orange-200 dark:border-dark-700 rounded-xl shadow-2xl z-50 p-2 flex flex-col gap-2">
                          <button className="text-left px-3 py-2 hover:bg-orange-50 dark:hover:bg-dark-700 rounded-lg text-orange-950 dark:text-white text-sm font-medium" onClick={() => {alert('Выдана привилегия'); setSelectedUserForGift(null)}}>SUPER (1 месяц)</button>
                          <button className="text-left px-3 py-2 hover:bg-orange-50 dark:hover:bg-dark-700 rounded-lg text-orange-950 dark:text-white text-sm font-medium" onClick={() => {alert('Выдана привилегия'); setSelectedUserForGift(null)}}>SUPER (3 месяца)</button>
                          <button className="text-left px-3 py-2 hover:bg-orange-50 dark:hover:bg-dark-700 rounded-lg text-orange-950 dark:text-white text-sm font-medium" onClick={() => {alert('Выдана привилегия'); setSelectedUserForGift(null)}}>SUPER (Навсегда)</button>
                          <button className="text-left px-3 py-2 hover:bg-amber-50 dark:hover:bg-dark-700 rounded-lg text-amber-600 dark:text-amber-500 text-sm font-bold" onClick={() => {alert('Выданы тикеты'); setSelectedUserForGift(null)}}>100 Тикетов</button>
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
