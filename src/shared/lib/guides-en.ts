export type { Guide, GuideSection, GuideFAQ } from "./guides";

import type { Guide } from "./guides";

export const guidesEn: Guide[] = [
  {
    slug: "kimchi-premium",
    title: "What Is the Kimchi Premium? Meaning, Calculation & Live Check",
    description:
      "Learn what the Kimchi Premium (KP) is, why it occurs, and how to calculate it. Check the live Kimchi Premium for free on TradeHub.",
    keywords: [
      "kimchi premium meaning",
      "kimchi premium calculation",
      "kimchi premium live",
      "upbit binance price difference",
      "kimchi premium check",
    ],
    publishedAt: "2025-01-15",
    updatedAt: "2025-06-01",
    readingTime: 5,
    category: "시장 지표",
    relatedSlugs: ["fear-greed-index", "crypto-whale", "crypto-treemap"],
    ctaTarget: "/dashboard",
    ctaText: "Check Live Kimchi Premium",
    sections: [
      {
        id: "what-is",
        heading: "What Is the Kimchi Premium?",
        content:
          "The Kimchi Premium refers to the phenomenon where cryptocurrency prices on Korean exchanges (Upbit, Bithumb, etc.) are higher than those on overseas exchanges (Binance, Coinbase, etc.). It is often abbreviated as 'KP'. For example, if Bitcoin is $60,000 on Binance but the KRW-equivalent price on Upbit is $62,000, the Kimchi Premium is approximately 3.3%.",
      },
      {
        id: "why",
        heading: "Why Does the Kimchi Premium Occur?",
        content:
          "The Kimchi Premium arises from several structural factors unique to the Korean market that create a price gap.",
        list: [
          "Capital movement restrictions: South Korea's Foreign Exchange Transactions Act imposes annual overseas remittance limits, making it difficult for individuals to profit from arbitrage by buying cheap abroad and selling at a premium domestically.",
          "Concentrated investment demand: South Korea has a high appetite for cryptocurrency investment, meaning domestic demand often exceeds supply.",
          "KRW market structure: Korean exchanges operate KRW-denominated markets, so exchange-rate fluctuations directly affect the Kimchi Premium.",
          "Market sentiment: During bull markets, rising FOMO (fear of missing out) tends to push the Kimchi Premium higher.",
        ],
      },
      {
        id: "how-to-calculate",
        heading: "How to Calculate the Kimchi Premium",
        content:
          "The Kimchi Premium can be calculated using the following formula.\n\nKimchi Premium (%) = ((Upbit KRW price / exchange rate) − Binance USD price) / Binance USD price × 100\n\nExample: If the Upbit BTC price is ₩83,000,000, the exchange rate is ₩1,350/USD, and the Binance BTC price is $60,000:\nKP = ((83,000,000 / 1,350) − 60,000) / 60,000 × 100 ≈ 2.47%",
      },
      {
        id: "how-to-read",
        heading: "How to Interpret the Kimchi Premium",
        content:
          "The Kimchi Premium level gives insight into the current state of the market.",
        table: {
          head: ["KP Level", "Market State", "Interpretation"],
          rows: [
            ["Below 0% (Negative)", "Oversold / Bear Market", "Korean prices are cheaper than overseas. Investor sentiment is extremely depressed."],
            ["0–2%", "Normal", "Within the normal range. A natural difference driven by exchange-rate fluctuations."],
            ["2–5%", "Early Overheating", "Domestic demand is rising. May signal the beginning of a bull market."],
            ["5%+", "Overheated", "Excessive FOMO. Be cautious of a short-term correction."],
          ],
        },
      },
      {
        id: "realtime",
        heading: "Check the Live Kimchi Premium",
        content:
          "The TradeHub dashboard automatically calculates the Kimchi Premium by comparing Upbit and Binance prices in real time. You can see the current KP at a glance without any manual calculation, and exchange-rate changes are reflected instantly.",
      },
    ],
    faqs: [
      {
        question: "What does a negative Kimchi Premium (reverse premium) mean?",
        answer:
          "A negative Kimchi Premium (reverse KP) occurs when Korean exchange prices are lower than overseas prices. It typically appears during severe downturns or when investor sentiment is extremely depressed. Historically, periods of negative KP have often coincided with attractive buying opportunities.",
      },
      {
        question: "Is it possible to arbitrage the Kimchi Premium?",
        answer:
          "In theory, yes — but in practice, capital movement restrictions under Korea's Foreign Exchange Transactions Act, transfer times between exchanges, and conversion fees make it very difficult for individuals to profit. Additionally, using illegal methods for arbitrage can result in legal penalties.",
      },
      {
        question: "Where can I check the Kimchi Premium?",
        answer:
          "You can check the live Kimchi Premium for free on the TradeHub dashboard. It automatically calculates the KP figure using Upbit–Binance prices and the current exchange rate.",
      },
    ],
  },
  {
    slug: "fear-greed-index",
    title: "What Is the Fear & Greed Index? How to Read It & Use It for Investing",
    description:
      "Learn the meaning of the Crypto Fear & Greed Index, its components, how to read it, and how to use it in your investment strategy.",
    keywords: [
      "fear greed index how to read",
      "fear greed index meaning",
      "Fear Greed Index",
      "fear greed index investing",
      "crypto market sentiment",
    ],
    publishedAt: "2025-01-20",
    updatedAt: "2025-06-01",
    readingTime: 5,
    category: "시장 지표",
    relatedSlugs: ["kimchi-premium", "crypto-liquidation", "crypto-treemap"],
    ctaTarget: "/dashboard",
    ctaText: "Check Live Fear & Greed Index",
    sections: [
      {
        id: "what-is",
        heading: "What Is the Fear & Greed Index?",
        content:
          "The Fear & Greed Index is an indicator that expresses cryptocurrency market sentiment on a scale from 0 to 100. A reading close to 0 indicates extreme fear in the market, while a reading close to 100 indicates extreme greed. The index was inspired by Warren Buffett's famous quote: \"Be fearful when others are greedy, and greedy when others are fearful.\"",
      },
      {
        id: "components",
        heading: "Components of the Fear & Greed Index",
        content:
          "The Fear & Greed Index is derived from multiple data sources, each weighted at a fixed proportion.",
        list: [
          "Volatility (25%): Current volatility and maximum drawdown are compared against 30-day and 90-day averages.",
          "Market Momentum / Volume (25%): Current trading volume is compared against 30-day and 90-day averages to gauge market activity.",
          "Social Media (15%): The volume and sentiment of cryptocurrency-related mentions on Twitter, Reddit, and similar platforms are analyzed.",
          "Surveys (15%): Results from investor sentiment surveys are incorporated.",
          "Bitcoin Dominance (10%): Changes in BTC's market share are tracked.",
          "Google Trends (10%): Changes in search volume for cryptocurrency-related terms are analyzed.",
        ],
      },
      {
        id: "how-to-read",
        heading: "How to Read the Fear & Greed Index",
        content:
          "The Fear & Greed Index represents the state of market sentiment across several ranges.",
        table: {
          head: ["Value", "State", "Meaning"],
          rows: [
            ["0–24", "Extreme Fear", "Investors are excessively fearful. Historically, this has sometimes presented buying opportunities."],
            ["25–44", "Fear", "Market sentiment is negative. Downward price pressure is present."],
            ["45–55", "Neutral", "The market is in a wait-and-see mode, searching for direction."],
            ["56–74", "Greed", "Investor sentiment is starting to overheat. Exercise caution with new entries."],
            ["75–100", "Extreme Greed", "The market is overheated. Prepare for a possible correction."],
          ],
        },
      },
      {
        id: "strategy",
        heading: "How to Use It for Investing",
        content:
          "The core principle of using the Fear & Greed Index in investing is contrarian thinking. During extreme fear (0–24), the market may be oversold, which can make dollar-cost averaging worth considering. During extreme greed (75–100), taking profits or avoiding new entries may be prudent. That said, it is important not to make investment decisions based on this index alone — use it alongside other indicators such as the Kimchi Premium, liquidation data, and trading volume.",
      },
      {
        id: "realtime",
        heading: "Checking the Fear & Greed Index on TradeHub",
        content:
          "The TradeHub dashboard provides the Fear & Greed Index in real time via an intuitive gauge chart. You can view the current value alongside yesterday's, last week's, and last month's readings, allowing you to track shifts in market sentiment at a glance.",
      },
    ],
    faqs: [
      {
        question: "Does a Fear & Greed Index of 0 always signal a good time to buy?",
        answer:
          "No. The Fear & Greed Index is a reference indicator that reflects market sentiment — it is not an absolute buy or sell signal. While extreme fear has historically preceded rebounds, there have also been cases where prices continued to fall. Always combine it with other indicators for a well-rounded judgment.",
      },
      {
        question: "How often is the Fear & Greed Index updated?",
        answer:
          "The Fear & Greed Index is updated once per day. TradeHub automatically reflects the latest data whenever it is available.",
      },
      {
        question: "What is the relationship between the Fear & Greed Index and Bitcoin's price?",
        answer:
          "In general, the greed score rises when Bitcoin's price increases, and the fear score rises when it falls. However, they do not always move in lockstep — the index sometimes leads price reversals, acting as a leading indicator.",
      },
    ],
  },
  {
    slug: "crypto-liquidation",
    title: "What Is Crypto Liquidation? Meaning, Conditions & Live Data",
    description:
      "Learn what crypto liquidation is, when it occurs, and how to calculate your liquidation price. Check live liquidation data on TradeHub.",
    keywords: [
      "crypto liquidation meaning",
      "what is crypto liquidation",
      "forced liquidation",
      "liquidation price calculation",
      "binance liquidation",
    ],
    publishedAt: "2025-02-01",
    updatedAt: "2025-06-01",
    readingTime: 6,
    category: "선물 거래",
    relatedSlugs: ["leverage-trading", "cross-isolated-margin", "crypto-whale"],
    ctaTarget: "/dashboard",
    ctaText: "Check Live Liquidation Data",
    sections: [
      {
        id: "what-is",
        heading: "What Is Crypto Liquidation?",
        content:
          "Crypto liquidation occurs in futures trading when the losses on a position exceed the margin (collateral), causing the exchange to forcibly close the position. In simple terms, when you are using leverage and the price moves against your position to the point where the losses can no longer be covered, the exchange automatically closes the position.",
      },
      {
        id: "why",
        heading: "When Does Liquidation Occur?",
        content:
          "Liquidation is triggered when the unrealized loss on a position reaches the maintenance margin level. Understanding the key conditions is essential.",
        list: [
          "Higher leverage means less room: 10x leverage can liquidate with a 10% adverse move; 100x can liquidate with just a 1% adverse move.",
          "Insufficient maintenance margin: If the account balance falls below the maintenance margin, liquidation is triggered.",
          "Sudden price swings: Sharp market spikes or crashes can liquidate many positions simultaneously.",
          "Failure to add margin: If you don't deposit additional margin after a margin call, forced liquidation is executed.",
        ],
      },
      {
        id: "calculation",
        heading: "How to Calculate the Liquidation Price",
        content:
          "The liquidation price varies depending on your leverage and position direction.\n\nLong position liquidation price = Entry price × (1 − 1 / leverage)\nShort position liquidation price = Entry price × (1 + 1 / leverage)\n\nExample: If you open a long BTC position at $60,000 with 10x leverage:\nLiquidation price = 60,000 × (1 − 1/10) = 60,000 × 0.9 = $54,000\nThis means if the price drops to $54,000, the position will be force-liquidated.",
      },
      {
        id: "types",
        heading: "Types of Liquidation",
        content: "Major exchanges like Binance handle liquidations in stages.",
        table: {
          head: ["Type", "Description"],
          rows: [
            ["Partial Liquidation", "Only a portion of the position is liquidated to meet the maintenance margin requirement."],
            ["Full Liquidation", "The entire position is forcibly closed. The full margin is lost."],
            ["ADL (Auto-Deleveraging)", "When the insurance fund cannot cover the liquidation loss, profitable positions on the opposite side are forcibly reduced."],
          ],
        },
      },
      {
        id: "prevent",
        heading: "How to Avoid Liquidation",
        content: "Key strategies to reduce your liquidation risk.",
        list: [
          "Use low leverage: Beginners are advised to use 3–5x leverage or lower.",
          "Set stop-loss orders: Always set a stop-loss to limit your downside on every position.",
          "Scale in gradually: Don't deploy your full capital at once — spread entries to diversify risk.",
          "Use isolated margin: Isolated margin limits the risk to the margin allocated to that specific position, unlike cross margin.",
          "Maintain sufficient margin buffer: Keep enough free margin well above the maintenance margin requirement.",
        ],
      },
      {
        id: "realtime",
        heading: "Check Live Liquidation Data",
        content:
          "The TradeHub dashboard provides real-time liquidation data from the Binance futures market. Large-scale liquidations can signal sharp directional reversals, making them an important reference for traders. You can monitor the size and coin type of long and short liquidations in real time via the liquidation feed.",
      },
    ],
    faqs: [
      {
        question: "Do I lose everything when I get liquidated?",
        answer:
          "In isolated margin mode, you only lose the margin allocated to that specific position. In cross margin mode, your entire account balance is used as collateral, so you could potentially lose all of it. Always confirm your margin mode before trading.",
      },
      {
        question: "What impact do large-scale liquidations have on the market?",
        answer:
          "Large-scale long liquidations add extra selling pressure, pushing prices down further (a long squeeze), while large-scale short liquidations cause prices to spike (a short squeeze). This is known as a cascade liquidation and is one of the primary causes of extreme market volatility.",
      },
      {
        question: "Where can I check liquidation data?",
        answer:
          "You can check live Binance futures liquidation data for free on the TradeHub dashboard. It provides a real-time feed of liquidation size, direction (long/short), and coin type.",
      },
    ],
  },
  {
    slug: "leverage-trading",
    title: "What Is Crypto Leverage Trading? Meaning & Risk by Multiplier",
    description:
      "Learn the meaning and mechanics of crypto leverage trading, risk levels by multiplier, and key tips for beginners. Practice safely on TradeHub.",
    keywords: [
      "what is leverage trading",
      "crypto leverage meaning",
      "leverage multiplier",
      "crypto futures leverage",
      "leverage trading risks",
    ],
    publishedAt: "2025-02-10",
    updatedAt: "2025-06-01",
    readingTime: 6,
    category: "선물 거래",
    relatedSlugs: [
      "cross-isolated-margin",
      "crypto-liquidation",
      "bitcoin-paper-trading",
    ],
    ctaTarget: "/trading",
    ctaText: "Start Leverage Paper Trading",
    sections: [
      {
        id: "what-is",
        heading: "What Is Leverage Trading?",
        content:
          "Leverage trading is a method that allows you to trade with a larger amount than your actual capital. By depositing a fraction of the total position value as collateral (margin), you borrow funds from the exchange to increase your exposure. For example, with 10x leverage you can hold a position worth ₩10,000,000 while only putting up ₩1,000,000.",
      },
      {
        id: "how-it-works",
        heading: "How Leverage Works",
        content:
          "Suppose you invest ₩1,000,000 with 10x leverage — your actual position size becomes ₩10,000,000. If the price rises 5%, your profit is ₩500,000 (50% of your capital). Conversely, if the price falls 5%, your loss is also ₩500,000 (50% of your capital). Because leverage amplifies both gains and losses, it is truly a double-edged sword.",
      },
      {
        id: "risk-by-leverage",
        heading: "Risk Comparison by Leverage Multiplier",
        content:
          "The higher the leverage, the less room you have before liquidation. Check the table below to see how much price movement it takes to reach liquidation at each multiplier.",
        table: {
          head: ["Leverage", "Price Move to Liquidation", "Risk Level", "Recommended For"],
          rows: [
            ["2x", "~50%", "Low", "Long-term investors"],
            ["5x", "~20%", "Medium", "Intermediate traders"],
            ["10x", "~10%", "High", "Experienced traders"],
            ["25x", "~4%", "Very High", "Professional traders"],
            ["50x", "~2%", "Extremely High", "Professional scalpers"],
            ["100x–125x", "~0.8–1%", "Maximum Risk", "Not recommended for regular use"],
          ],
        },
      },
      {
        id: "long-short",
        heading: "Long and Short Positions",
        content:
          "In leverage trading, you can bet on both price increases and decreases.",
        list: [
          "Long position: Entered when you expect the price to rise. A profit is generated when the price increases after opening the position.",
          "Short position: Entered when you expect the price to fall. A profit is generated when the price decreases after opening the position.",
          "Two-way trading: One of the key advantages of futures trading is the ability to find profit opportunities in both bull and bear markets.",
        ],
      },
      {
        id: "beginner-tips",
        heading: "Key Tips for Leverage Beginners",
        content: "Essential tips for those just getting started with leverage trading.",
        list: [
          "Practice with paper trading first: Always practice with simulated trading before committing real capital.",
          "Start with low multipliers: Begin with 2–3x leverage and increase it gradually as you gain experience.",
          "Manage your position size: Use no more than 10% of your total assets for leverage trading.",
          "Always set a stop-loss: Set a stop-loss on every position without exception.",
          "Don't let emotions drive decisions: Increasing leverage to recover losses is extremely dangerous.",
        ],
      },
      {
        id: "practice",
        heading: "Practice Safely on TradeHub",
        content:
          "TradeHub's paper trading lets you practice leverage trading up to 125x with a virtual balance of 10,000 USDT, completely free of charge. Because it is based on real-time Binance prices, you can develop a genuine feel for leverage trading in a live-market environment with zero risk.",
      },
    ],
    faqs: [
      {
        question: "What is the difference between leverage trading and spot trading?",
        answer:
          "Spot trading involves actually buying and holding a coin. Leverage (futures) trading involves trading contracts that profit from price movements. With spot trading, the maximum loss is limited to your investment, whereas with leverage trading you can lose more than your margin and can also profit from price declines using short positions.",
      },
      {
        question: "What leverage multiplier do you recommend for beginners?",
        answer:
          "For beginners, 2–3x leverage is recommended. At this level, you can withstand a 33–50% price swing, making it relatively safe to develop your trading instincts. Increase the multiplier only after you have practiced sufficiently with paper trading.",
      },
      {
        question: "Can I practice leverage trading for free?",
        answer:
          "Yes — on TradeHub you can practice leverage trading up to 125x with a virtual balance of 10,000 USDT, completely free. Test a variety of strategies risk-free using real-time Binance prices.",
      },
    ],
  },
  {
    slug: "cross-isolated-margin",
    title: "Cross Margin vs. Isolated Margin: Key Differences",
    description:
      "Compare cross margin and isolated margin in crypto futures trading — their differences, pros and cons, and when to use each mode.",
    keywords: [
      "cross margin isolated margin difference",
      "Cross Margin Isolated Margin",
      "margin mode",
      "crypto futures margin",
      "what is isolated margin",
    ],
    publishedAt: "2025-02-15",
    updatedAt: "2025-06-01",
    readingTime: 5,
    category: "선물 거래",
    relatedSlugs: [
      "leverage-trading",
      "crypto-liquidation",
      "bitcoin-paper-trading",
    ],
    ctaTarget: "/trading",
    ctaText: "Try Both Margin Modes",
    sections: [
      {
        id: "what-is-margin",
        heading: "What Is Margin (Collateral)?",
        content:
          "Margin is the collateral deposited with an exchange to open and maintain a leveraged position. The minimum amount required to keep a position open is called the maintenance margin, and the amount required to open a position is called the initial margin. How this margin is managed depends on which margin mode you select.",
      },
      {
        id: "cross-margin",
        heading: "What Is Cross Margin?",
        content:
          "Cross margin shares the entire available account balance as collateral across all open positions.",
        list: [
          "Advantage: The risk of individual positions being liquidated is lower, because free balance is automatically used to top up margin.",
          "Advantage: Capital efficiency is higher when running multiple positions simultaneously.",
          "Disadvantage: A large loss on one position exposes the entire account balance to risk.",
          "Disadvantage: In the worst case, you can lose your entire account balance.",
        ],
      },
      {
        id: "isolated-margin",
        heading: "What Is Isolated Margin?",
        content:
          "Isolated margin assigns margin to each position individually. A loss on one position does not affect other positions or the remaining account balance.",
        list: [
          "Advantage: Risk is capped at the margin assigned to that position, giving you control over your losses.",
          "Advantage: Independent risk management is possible on a per-position basis.",
          "Disadvantage: Individual positions can be liquidated more easily during large price swings.",
          "Disadvantage: You must manually add margin if needed, which requires more active management.",
        ],
      },
      {
        id: "comparison",
        heading: "Cross Margin vs. Isolated Margin: Side-by-Side",
        content: "A quick comparison of the key differences between the two margin modes.",
        table: {
          head: ["Item", "Cross Margin", "Isolated Margin"],
          rows: [
            ["Margin scope", "Entire account balance", "Allocated per position"],
            ["Liquidation risk", "Lower (balance acts as a buffer)", "Higher (only allocated margin is used)"],
            ["Maximum loss", "Entire account balance", "Allocated margin only"],
            ["Risk management", "Harder", "Easier"],
            ["Best for", "Hedging, low leverage", "High leverage, beginners"],
          ],
        },
      },
      {
        id: "when-to-use",
        heading: "When Should You Use Each Mode?",
        content: "A guide to choosing the right margin mode based on your situation.",
        list: [
          "Beginners: Use isolated margin. Losses are capped, making it suitable for learning.",
          "High-leverage trades: Use isolated margin to confine risk to the specific position.",
          "Hedging: Cross margin is more appropriate. Opposing positions can supplement each other's margin.",
          "Low-leverage, long-term positions: Cross margin can improve capital efficiency.",
          "Running multiple positions: Isolated margin is safer when you want to separate risk between positions.",
        ],
      },
      {
        id: "practice",
        heading: "Try Both Margin Modes on TradeHub",
        content:
          "TradeHub's paper trading supports both cross margin and isolated margin. Experience the differences between the two modes first-hand with no real-money risk, and find the margin strategy that suits you best.",
      },
    ],
    faqs: [
      {
        question: "Which margin mode do you recommend for beginners — cross or isolated?",
        answer:
          "Isolated margin is recommended for beginners. Since losses are capped at the margin allocated to that position, it prevents a single mistake from wiping out your entire account.",
      },
      {
        question: "Can I switch margin modes while a trade is open?",
        answer:
          "In general, you cannot change the margin mode of an existing open position. You must configure the margin mode before opening a new position.",
      },
      {
        question: "In cross margin, what happens to other positions if one position is liquidated?",
        answer:
          "In cross margin, if the loss on one position grows, margin is drawn from the entire account balance. If one position incurs losses large enough to trigger liquidation, the margin available for other positions also decreases, which can trigger a cascade of liquidations.",
      },
    ],
  },
  {
    slug: "bitcoin-paper-trading",
    title: "How to Start Bitcoin Paper Trading",
    description:
      "A guide to getting started with Bitcoin paper trading (simulated trading), its benefits, and recommended platforms. Start for free on TradeHub.",
    keywords: [
      "how to start bitcoin paper trading",
      "crypto paper trading",
      "bitcoin simulated trading",
      "crypto virtual trading",
      "bitcoin practice trading",
    ],
    publishedAt: "2025-02-20",
    updatedAt: "2025-06-01",
    readingTime: 5,
    category: "투자 도구",
    relatedSlugs: [
      "leverage-trading",
      "cross-isolated-margin",
      "crypto-liquidation",
    ],
    ctaTarget: "/trading",
    ctaText: "Start Free Paper Trading",
    sections: [
      {
        id: "what-is",
        heading: "What Is Bitcoin Paper Trading?",
        content:
          "Bitcoin paper trading is the practice of simulating Bitcoin trades using virtual funds rather than real money. Because it uses real market data to simulate trades, you can develop genuine trading skills in an environment almost identical to live trading. It is used by beginners to gain experience before investing real capital, and by experienced traders to test new strategies.",
      },
      {
        id: "why",
        heading: "Why You Should Paper Trade First",
        content: "Here are the key reasons why paper trading matters before going live.",
        list: [
          "Zero risk: You can practice freely without worrying about losing real money.",
          "Real-market feel: Because it is based on live market data, you develop the same intuition as in live trading.",
          "Strategy validation: You can test and validate new trading strategies without using real funds.",
          "Emotional discipline: You get a preview of how to manage your emotions during both profitable and losing situations.",
          "Tool mastery: You can learn how to use order types, leverage, margin modes, and other trading tools.",
        ],
      },
      {
        id: "how-to-start",
        heading: "How to Start Paper Trading on TradeHub",
        content:
          "Getting started with Bitcoin paper trading on TradeHub is extremely straightforward.",
        list: [
          "Step 1: Visit tradehub.kr and click the 'Launch' or 'START REAL-TIME' button.",
          "Step 2: On the trading page, 10,000 USDT in virtual funds is automatically credited to your account.",
          "Step 3: Set your leverage multiplier and margin mode (cross or isolated).",
          "Step 4: Choose your direction — long (buy) or short (sell) — and execute the order.",
          "Step 5: Monitor the live chart and your position status to manage the trade.",
        ],
      },
      {
        id: "features",
        heading: "Key Features of TradeHub Paper Trading",
        content: "The core features available in TradeHub's paper trading.",
        table: {
          head: ["Feature", "Description"],
          rows: [
            ["Live prices", "Based on real-time Binance BTC/USDT prices"],
            ["Up to 125x leverage", "Freely adjustable from 1x to 125x"],
            ["Long & Short", "Trade both upward and downward price moves"],
            ["Multiple order types", "Market, limit, and stop-market orders supported"],
            ["TP/SL settings", "Automatic take-profit and stop-loss for risk management"],
            ["Cross & Isolated margin", "Both margin modes fully supported"],
            ["No registration required", "Start instantly without signing up"],
          ],
        },
      },
      {
        id: "tips",
        heading: "Tips to Get the Most Out of Paper Trading",
        content: "Key tips to make your paper trading feel as close to live trading as possible.",
        list: [
          "Treat it like real money: Even though the funds are virtual, approach every trade with the same seriousness you would if real money were at stake.",
          "Keep a trading journal: Record your rationale, entry/exit prices, and P&L to identify patterns in your trading behavior.",
          "Try diverse strategies: Test various approaches such as scalping, swing trading, and more.",
          "Build risk management habits: Practice strict stop-loss placement and position sizing from the very start.",
          "Practice consistently over time: Aim to paper trade for at least one month before transitioning to live trading.",
        ],
      },
    ],
    faqs: [
      {
        question: "What is the difference between paper trading and real trading?",
        answer:
          "The biggest difference is psychological pressure. Because real money is not at stake, traders tend to make bolder decisions in paper trading. Live trading also introduces slippage (differences in fill prices) and liquidity constraints that paper trading does not fully replicate.",
      },
      {
        question: "What happens if I run out of paper trading funds?",
        answer:
          "On TradeHub, you can reset your paper trading balance. Even if your funds run out, you can reset back to 10,000 USDT and continue practicing.",
      },
      {
        question: "Can I paper trade without signing up?",
        answer:
          "Yes — on TradeHub you can start paper trading immediately without any registration or personal information. Simply visit the site and navigate to the trading page to receive your 10,000 USDT virtual balance instantly.",
      },
    ],
  },
  {
    slug: "crypto-whale",
    title: "What Is a Crypto Whale? How to Track Whale Transactions",
    description:
      "Learn what a crypto whale is, how whales affect the market, and how to track their transactions. Easy to understand.",
    keywords: [
      "crypto whale meaning",
      "whale transaction tracking",
      "bitcoin whale",
      "large crypto transactions",
      "whale buy sell",
    ],
    publishedAt: "2025-03-01",
    updatedAt: "2025-06-01",
    readingTime: 5,
    category: "시장 지표",
    relatedSlugs: ["crypto-liquidation", "kimchi-premium", "crypto-treemap"],
    ctaTarget: "/dashboard",
    ctaText: "Check Live Whale Transactions",
    sections: [
      {
        id: "what-is",
        heading: "What Is a Crypto Whale?",
        content:
          "A crypto whale is an individual or institution holding such a large amount of cryptocurrency that their trading activity can significantly influence the market. Generally, a wallet holding 1,000 BTC or more (worth hundreds of millions of dollars) is classified as a whale. Whale trading activity is one of the key indicators traders watch because it can directly affect market prices.",
      },
      {
        id: "impact",
        heading: "How Whales Impact the Market",
        content: "The main ways whale trading activity affects the market.",
        list: [
          "Sharp price moves: When a large buy or sell order is filled all at once, prices can spike or crash suddenly.",
          "Liquidity changes: When a whale deposits a large amount of coins to an exchange, selling pressure increases; withdrawals reduce selling pressure.",
          "Sentiment shifts: When whale movements become known, retail investors often follow suit, helping set the market direction.",
          "Slippage: Large orders consume the order book in one go, causing significant price slippage.",
        ],
      },
      {
        id: "types",
        heading: "Types of Crypto Whales",
        content: "Crypto whales come in several varieties.",
        list: [
          "Early miners: Individuals who mined Bitcoin from the very beginning and accumulated large holdings (e.g., Satoshi Nakamoto).",
          "Institutional investors: Corporations such as MicroStrategy and Tesla that have purchased Bitcoin at a corporate level.",
          "Exchange wallets: Large wallets managed by exchanges like Binance and Coinbase.",
          "DeFi protocols: DeFi projects with large amounts of assets locked in smart contracts.",
          "Government entities: Governments that hold large amounts of cryptocurrency seized as criminal proceeds.",
        ],
      },
      {
        id: "how-to-track",
        heading: "How to Track Whale Transactions",
        content: "There are several ways to track whale movements.",
        list: [
          "Real-time trade monitoring: The TradeHub dashboard lets you track large trades of $50,000 or more in real time.",
          "On-chain data analysis: Use blockchain explorers to track large wallet deposit and withdrawal histories.",
          "Exchange flow tracking: When a whale deposits coins to an exchange it is often interpreted as a sell signal; withdrawals suggest long-term holding.",
          "Social media monitoring: Follow whale alert bots and analyst accounts for real-time notifications.",
        ],
      },
      {
        id: "strategy",
        heading: "How to Use Whale Activity in Your Investing",
        content:
          "Monitoring whale movements can help predict market direction. Large withdrawals from exchanges are interpreted as an intent to hold long-term and are considered a positive signal, while large deposits may indicate preparation to sell. That said, you can never know a whale's exact intent, so always combine this signal with other indicators for a comprehensive view.",
      },
      {
        id: "realtime",
        heading: "Check Whale Transactions on TradeHub",
        content:
          "The TradeHub dashboard tracks large trades of $50,000 or more on Binance in real time. You can see the direction (buy/sell), size, and coin type at a glance, letting you quickly spot whale activity.",
      },
    ],
    faqs: [
      {
        question: "How much Bitcoin do you need to hold to be considered a whale?",
        answer:
          "Wallets holding 1,000 BTC or more are generally classified as whales. However, there is no hard rule — some classify wallets with 100 BTC or more as 'mini-whales'.",
      },
      {
        question: "Does a whale selling always cause a price drop?",
        answer:
          "Not necessarily. If a whale sells through an OTC (over-the-counter) deal, the direct impact on the market price is limited. Additionally, if there is sufficient buying demand in the market, prices may hold steady even after a large sell-off.",
      },
      {
        question: "Where can I track whale transactions in real time?",
        answer:
          "You can check large Binance trades of $50,000 or more for free on the TradeHub dashboard. It provides a real-time feed of transaction direction, size, and coin type.",
      },
    ],
  },
  {
    slug: "crypto-treemap",
    title: "What Is a Crypto Treemap? How to Read the Market at a Glance",
    description:
      "Learn what a crypto treemap is, how to read it, and how to use it for investing. View 150+ coin treemaps for free on TradeHub.",
    keywords: [
      "crypto treemap",
      "cryptocurrency treemap",
      "crypto heatmap",
      "crypto market visualization",
      "crypto market cap treemap",
    ],
    publishedAt: "2025-03-10",
    updatedAt: "2025-06-01",
    readingTime: 4,
    category: "투자 도구",
    relatedSlugs: ["fear-greed-index", "crypto-whale", "kimchi-premium"],
    ctaTarget: "/dashboard",
    ctaText: "Check Live Treemap",
    sections: [
      {
        id: "what-is",
        heading: "What Is a Crypto Treemap?",
        content:
          "A crypto treemap is a chart that displays the entire cryptocurrency market visually on a single screen. Each coin is represented as a rectangular block — the size of the block reflects trading volume or market cap, and the color represents the price change percentage. Green means a price increase, red means a decrease. The concept is similar to the heatmaps used in stock markets.",
      },
      {
        id: "how-to-read",
        heading: "How to Read a Treemap",
        content: "Understanding the core elements of a treemap lets you quickly assess the market.",
        list: [
          "Block size: Larger blocks represent coins with higher trading volume (or market cap). Major coins like BTC and ETH occupy the largest blocks.",
          "Color intensity: Deep green means a strong increase; deep red means a strong decrease. Lighter colors indicate smaller price swings.",
          "Position and grouping: Coins in similar sectors (DeFi, Layer 1, meme coins, etc.) are placed adjacent to each other.",
          "Overall color balance: A predominantly green treemap signals a bull market; mostly red signals a bear market.",
        ],
      },
      {
        id: "benefits",
        heading: "Benefits of the Treemap",
        content: "Why a treemap is useful for traders.",
        list: [
          "Full market overview: See the status of hundreds of coins on a single screen instantly.",
          "Spot outperformers and underperformers: Quickly identify which coins are making big moves just by looking at the colors.",
          "Sector analysis: Identify broader trends where an entire sector (DeFi, gaming, etc.) is rising or falling together.",
          "Intuitive understanding: Grasp market conditions visually without having to read through rows of numbers.",
        ],
      },
      {
        id: "strategy",
        heading: "How to Use the Treemap for Investing",
        content:
          "The treemap is useful for reading the overall market flow and generating trading ideas. If the whole market is red but one particular coin is showing strong green, there may be positive news for that coin. Conversely, if the market is rising but a specific sector is all red, it is worth investigating what negative development is weighing on that sector. Making a habit of checking the treemap every morning is an easy way to stay up to speed on market conditions.",
      },
      {
        id: "realtime",
        heading: "TradeHub Treemap Features",
        content:
          "The TradeHub dashboard provides a volume-based treemap for over 150 cryptocurrencies. It updates in real time, and you can view each coin's current price, price change, and trading volume. No additional app installation is required — it works directly in your web browser.",
      },
    ],
    faqs: [
      {
        question: "What is the difference between a treemap and a heatmap?",
        answer:
          "The two terms are often used interchangeably. Strictly speaking, a treemap uses a hierarchical structure where rectangle sizes vary to represent data, while a heatmap uses a uniform grid where only color encodes the data. In the cryptocurrency market, the two terms are used interchangeably.",
      },
      {
        question: "What determines block size in the treemap?",
        answer:
          "In the TradeHub treemap, block size is based on 24-hour trading volume. Coins with higher trading volume are shown as larger blocks, making it easy to identify which coins are the most actively traded in the current market.",
      },
      {
        question: "How often is the treemap updated?",
        answer:
          "The TradeHub treemap updates in real time. Price changes and volume shifts are reflected immediately, so you always have access to the latest market data.",
      },
    ],
  },
];

export function getGuideBySlugEn(slug: string): Guide | undefined {
  return guidesEn.find((g) => g.slug === slug);
}
