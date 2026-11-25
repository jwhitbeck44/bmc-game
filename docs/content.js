// Build. Break. Rebuild. · every word a student sees lives in this file.
// Edit the text between the quotes. Keep the quotes, commas and brackets as they are.
// After an edit: bump ?v= on the content.js line in index.html so phones pick up the new file.
// No em dashes, please. Sentence case.
//
// EXAMPLE lines are written for one invented venture, "Ladle Patrol" (bike-delivered soup for
// night-shift nurses). Nothing in them is real, so nothing needs fact-checking. Swap in your own store
// by changing every line marked EXAMPLE.

window.CONTENT = {
  title: "Build. Break. Rebuild.",
  kicker: "ENTP 3000 · Entrepreneurship for Everyone",

  // The strip at the top of every screen
  strip: { built: "blocks built", cracks: "cracks found", version: "version" },

  // Rail buttons
  rail: { start: "Start", build: "1 Build", break: "2 Break", rebuild: "3 Rebuild", handin: "Hand in" },

  start: {
    h1: "Build it. Break it. Build it again.",
    lede: "Your venture on one page, nine blocks. Then your Board tries to break it. Finding the crack is the whole point.",
    nameLabel: "Venture name",
    namePh: "Call it something. You can change it.",
    aboutLabel: "One sentence about it",
    aboutPh: "What is it, and who is it for?",
    go: "Start building",
    saved: "Saves on this phone as you type. No account.",
    rounds: [
      "Round 1 · Build: nine blocks, fast and rough. About 15 minutes.",
      "Round 2 · Break: your Board pokes holes in it.",
      "Round 3 · Rebuild: fix the crack. Make version 2.",
    ],
  },

  build: {
    kicker: "Round 1 · Build",
    blockOf: "Block {n} of 9",
    ph: "One or two lines. Rough is fine.",
    showEx: "Show me an example",
    hideEx: "Hide the example",
    exLead: "Ladle Patrol says:", // EXAMPLE (the invented venture's name)
    back: "Back",
    next: "Next block",
    toDial: "On to the dial",
    skipNote: "No block is required. Skip and come back.",
    tapNote: "Tap any block to jump to it.",
  },

  // The nine blocks, in the briefing's order. short = the label inside the small canvas picture.
  blocks: [
    { id: "cs", name: "Customer Segments", nick: "The Tribe", short: "Tribe",
      q: "Who is this for? Be specific. \"Everyone\" is no one.",
      ex: "Night-shift nurses at two hospitals near campus. Dinner is a vending machine at 3 a.m." }, // EXAMPLE
    { id: "vp", name: "Value Propositions", nick: "The Fix", short: "Fix",
      q: "What pain do you kill, or what joy do you bring?",
      ex: "Hot homemade soup at 2 a.m., brought to the staff door. No app, no wait." }, // EXAMPLE
    { id: "ch", name: "Channels", nick: "The Distribution", short: "Distro",
      q: "How does it get into their hands? How do they hear about it?",
      ex: "A text line for orders, and a flyer on the break room fridge." }, // EXAMPLE
    { id: "cr", name: "Customer Relationships", nick: "The Vibe", short: "Vibe",
      q: "How do you treat your people? Self-serve, or you know them by name?",
      ex: "I know every regular by name. One group text a week with the menu." }, // EXAMPLE
    { id: "rs", name: "Revenue Streams", nick: "The Fuel", short: "Fuel",
      q: "How does money come in?",
      note: "Nonprofit, collective or research project? Read this as your funding mix.",
      ex: "$8 a bowl, or $30 for a five-bowl punch card." }, // EXAMPLE
    { id: "kr", name: "Key Resources", nick: "The Arsenal", short: "Arsenal",
      q: "What do you already have? Gear, skills, people, cash.",
      ex: "My roommate's giant pot, a bike with a cargo box, and my grandma's recipes." }, // EXAMPLE
    { id: "ka", name: "Key Activities", nick: "The Daily Grind", short: "Grind",
      q: "What do you have to do every week to make it work?",
      ex: "Cook at 9 p.m., take orders until midnight, ride at 2 a.m." }, // EXAMPLE
    { id: "kp", name: "Key Partnerships", nick: "The Co-Conspirators", short: "Co-Conspirators",
      q: "Who outside your team helps you pull it off?",
      ex: "A church kitchen that rents its stove by the hour. One charge nurse who spreads the word." }, // EXAMPLE
    { id: "co", name: "Cost Structure", nick: "The Burn", short: "Burn",
      q: "What does it cost to keep the lights on?",
      ex: "Kitchen rent $200 a month. About $2 a bowl for food and containers." }, // EXAMPLE
  ],

  dial: {
    kicker: "Round 1 · The dial",
    h2: "Scarce or abundant?",
    lede: "Supreme keeps it rare. The Grateful Dead gave it away. Where does yours sit?",
    left: "Supreme (scarce)",
    right: "Grateful Dead (abundant)",
    // What the page says under the slider, from far left to far right
    read: ["All Supreme", "Mostly scarce", "Right in the middle", "Mostly abundant", "All Grateful Dead"],
    giveLabel: "What do you give away or make plentiful?",
    givePh: "The free part, the easy part, the part everyone can get.",
    giveEx: "A free cup for anyone on their first night shift.", // EXAMPLE
    keepLabel: "What one thing do you keep scarce?",
    keepPh: "The part people have to wait for, earn, or pay for.",
    keepEx: "Only 40 bowls a night. When they're gone, they're gone.", // EXAMPLE
    done: "Done building. Time to break it.",
  },

  breakIntro: {
    kicker: "Round 2 · Break",
    h2: "Hand your phone to a Board-mate.",
    lede: "Their job: find where this breaks. Your job: stay quiet and let them.",
    whoLabel: "Board-mate, type your first name",
    whoPh: "First name",
    soloLabel: "Working alone? Answer these yourself.",
    soloLine: "Round 2 done solo by the founder.",
    go: "Start breaking",
    peek: "Here is the canvas you are breaking.",
  },

  pairs: {
    kicker: "Round 2 · Break · Six questions",
    lede: "Each question tests two blocks together. Go with your gut.",
    holds: "Holds", shaky: "Shaky", breaks: "Breaks",
    whyPh: "Why? One line. Optional.",
    fromMoney: "From the money check: {in} in, {out} out each month. Change it if you disagree.",
    fillMoney: "Fill in the money check and this one answers itself. Or answer it now.",
    next: "Next: the money check",
  },

  // The six pair questions. a and b are block ids from the list above.
  pairQs: [
    { a: "cs", b: "vp", q: "Would these people say this is their problem, in their own words?" },
    { a: "ch", b: "cs", q: "Does this channel reach these people where they already are?" },
    { a: "rs", b: "cs", q: "Will these people pay this, this way?" },
    { a: "ka", b: "kr", q: "Do the daily activities need something you do not have yet?" },
    { a: "kp", b: "ka", q: "What happens the week your key partner says no?" },
    { a: "rs", b: "co", q: "Does the money in cover the money out, with you getting paid?", money: true },
  ],

  money: {
    kicker: "Round 2 · Break · The money check",
    lede: "Four rough numbers. Guesses are fine. Your pay counts as a cost, because a founder who works for free burns out.",
    price: "Price per sale (or average gift)",
    qty: "Sales (or gifts) per month you think you can get",
    cost: "Monthly cost to run it",
    pay: "What you need to be paid each month",
    moneyIn: "Money in",
    barIn: "in",
    barOut: "out",
    moneyOut: "Money out, with your pay",
    perMonth: "a month",
    gap: "Left over",
    short: "Short",
    need: "Sales a month to cover it",
    youSaid: "You guessed",
    noPrice: "Add a price to see how many sales cover it.",
    noCosts: "Add your costs and your pay to see the gap.",
    free: "Costs nothing to run? Then you are the cost. Add your pay.",
    addPay: "Your pay is blank. It counts as a cost, so put in a number.",
    nan: "Numbers only, like 12 or 1,500.",
    neg: "Numbers here can't be negative.",
    next: "Next: event cards",
  },

  cards: {
    kicker: "Round 2 · Break · Event cards",
    lede: "Three things happen to this venture. Does it live?",
    survives: "Survives", hurts: "Hurts", kills: "Kills it",
    hits: "Hits",
    whyPh: "Why? One line.",
    redraw: "Draw three new cards",
    redrawAsk: "Toss these three cards and their answers?",
    next: "Next: pick the breaking point",
  },

  // About 24 event cards. block = the block it hits. Spread across all nine.
  deck: [
    { block: "cs", t: "The people you built this for leave town for the summer." },
    { block: "cs", t: "A different group loves it more than the one you planned for." },
    { block: "cs", t: "Your people's budget gets cut in half this year." },
    { block: "vp", t: "A bigger player starts giving your thing away for free." },
    { block: "vp", t: "The city fixes the problem you were fixing." },
    { block: "vp", t: "Your people say it's nice to have, not need to have." },
    { block: "ch", t: "Your one channel changes its rules overnight." },
    { block: "ch", t: "The venue that hosts you closes for good." },
    { block: "ch", t: "Your video blows up, in the wrong city." },
    { block: "cr", t: "Your first ten customers love it and tell nobody." },
    { block: "cr", t: "One angry review gets more views than all your good ones." },
    { block: "cr", t: "Your people want to hear from you every day. You have time for once a month." },
    { block: "rs", t: "The grant you counted on goes to someone else." },
    { block: "rs", t: "Half your customers ask to pay later." },
    { block: "rs", t: "Your biggest donor wants a say in everything." },
    { block: "kr", t: "The one person who knows how to make it gets sick for a month." },
    { block: "kr", t: "Your main gear breaks. The fix costs $500." },
    { block: "kr", t: "The free space you work in starts charging rent." },
    { block: "ka", t: "You get ten times the orders you planned for." },
    { block: "ka", t: "Finals hit. You have almost zero hours for three weeks." },
    { block: "kp", t: "Your key partner quits." },
    { block: "kp", t: "Your supplier starts selling straight to your customers." },
    { block: "co", t: "Your costs go up 30%." },
    { block: "co", t: "Surprise: you need a $1,000 permit you never heard of." },
  ],

  breakpoint: {
    kicker: "Round 2 · Break · The breaking point",
    h2: "Founder, take your phone back.",
    lede: "Here is every crack your Board found. You pick the one that matters most.",
    none: "No cracks yet? A canvas where every block looks fine is the one that scores low. Go back and push harder.",
    pairTag: "Pair",
    cardTag: "Card",
    other: "Something else broke",
    otherPh: "What broke?",
    sentenceLabel: "Say the breaking point in one sentence",
    sentencePh: "Like: \"My channel never reaches my segment.\"",
    toRebuild: "Take it home and rebuild",
  },

  rebuild: {
    kicker: "Round 3 · Rebuild",
    h2: "Fix the crack.",
    lede: "Start with the blocks tied to your breaking point. Change anything you want.",
    tied: "Tied to the breaking point",
    rest: "The other blocks",
    noBp: "No breaking point picked yet. Every block is open.",
    changed: "changed",
    was: "Was:",
    whatLabel: "What changed, and why?",
    whatPh: "Name the blocks you changed and how. Why does this fix the crack?",
    lock: "Lock in version {n} and keep going",
    lockedNote: "Version {n} is locked in. Your next change starts version {m}.",
    toHandin: "See my hand-in page",
  },

  handin: {
    kicker: "Hand in · Design Thinking Part III",
    canvasH: "My canvas",
    versionStamp: "Version {n}",
    changedKey: "Gold blocks changed since version 1.",
    step2: "Step 2 · Scarcity or Abundance",
    step3: "Step 3 · The Breaking Point",
    step4: "Step 4 · The Iteration",
    sitsAt: "Where it sits:",
    sitsFmt: "{read} ({n} of 100, where 0 is all Supreme and 100 is all Grateful Dead)",
    give: "What I give away:",
    keep: "What I keep scarce:",
    foundBy: "Board-mate:",
    aiH: "AI line",
    aiLabel: "Say what you used and for what",
    aiPh: "Like: \"I used ChatGPT to brainstorm channels.\" Or: \"No AI.\"",
    words: "{n} words in Steps 2 to 4. The task page asks for 200 to 400.",
    pdf: "Save as PDF",
    pdfTip: "In the print box, pick \"Save as PDF.\" Upload that file to Canvas.",
    copy: "Copy as text",
    copied: "Copied.",
    copyFail: "Your browser blocked copying. Select the text below and copy it.",
    empty: "(blank)",
  },

  link: {
    copy: "Copy my link",
    copied: "Link copied. Open it on another device, or send it to a Board-mate.",
    fail: "Copy this link:",
    askH: "This link has a canvas in it.",
    askP: "You already have one on this phone. Which one do you want? If you use the link, yours waits behind a \"Back to my canvas\" button.",
    useLink: "Use the one in the link",
    keepMine: "Keep mine",
    backToMine: "Back to my canvas",
    backAsk: "Go back to your own canvas? The one from the link leaves this phone.",
    tooBig: "This link is long. Some apps cut long links. If it breaks, use a laptop.",
  },

  footer: "Saves on this device only. Clear your browser and it's gone, so save a PDF.",
  reset: "Start over",
  resetAsk: "Erase this whole canvas from this phone? This can't be undone.",
};
