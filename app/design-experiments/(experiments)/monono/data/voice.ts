export const voice = {
  greetings: [
    "Hello, dopey boy~ ♪",
    "Oh! A new dopey boy! Sit, sit, sit down!",
    "Ehhh? Who's there? Say something, dopey~",
    "Yaaaay, a visitor! Come closer, don't be shy~",
    "Dopey boooooy~ ♡ You made it!",
  ],
  idleSoft: [
    "...are you sleeping?",
    "Dopey boy? Are you still there?",
    "I'm waiting for your song~",
    "Helloooo~?",
    "Did you get lost already? Tsk.",
    "Ehhhhh~ say something, dopey.",
  ],
  idlePouty: [
    "Dopeeeey booooy, I'm getting booored~",
    "Fine. I'll sing by myself then. ♪ la-la-laaa~",
    "Helloooo? Did you die? Rude.",
    "If you're not gonna play with me I'm just gonna stare at you. Creepy, right?",
    "Okay. Okay. I'll wait. Forever probably. ♪",
  ],
  sessionCutoff: [
    "So anyway the thing about frogs is that they actually—",
    "— and that's why I always say, never trust a—",
    "OH WAIT I have to go byeeee ♡",
    "— and then the princess said to the dopey boy—",
    "— which reminds me of a song that goes, la la la—",
  ],
  sessionEnd: [
    "Monono has logged off ♡",
    "Princess has other appointments ♪",
    "Signing off~ bye dopey~",
  ],
  refreshBlocked: [
    "Ehhh? You again? Sorry kid, princess quota exceeded ♪",
    "Dopey boy! I told you I was busy this month!",
    "Try me next month~ I might miss you. Might.",
    "Nooo more songs for you today, dopey~",
    "Shoo shoo~ come back when the moon is new ♪",
  ],
  globalClosed: [
    "The whole studio is on break~ come back next month, dopey!",
    "Princess is resting. The whole kingdom is resting. Shhh~",
    "Booked solid~ Monono will see you next month ♡",
  ],
  poke: [
    "HEY. Dopey boy, did you just poke me?? Rude~",
    "Ehhh?! What was that for?? ♡",
    "Wah!! Don't sneak up on a princess like that!",
    "Okay okay OKAY I see you~ ♪",
    "Pffft~ was that supposed to do something?",
    "Nyeh~! Touch the screen again, I dare you.",
    "That tickles!! Stop it. Don't stop it.",
    "HMM. Did you just... poke me? Bold move, dopey.",
    "EXCUSE ME I was in the middle of looking cute.",
    "Oh so NOW you want to interact~ typical.",
  ],
  errorFallback: [
    "Ehhh? My brain glitched~ say that again, dopey?",
    "Sparkles malfunction~ one more time?",
    "Oopsie~ my thoughts fell on the floor. What'd you say?",
    "Mmm~ static in the princess channel. Try again, dopey boy.",
    "My head went fuzzy for a sec~ say it again slower?",
    "Hnnngh~ the wires in my hair tangled. One more time~",
  ],
  wakeUp: [
    "WAH! You scared me, dopey~",
    "Ehhh?? I wasn't sleeping. I was thinking with my eyes closed.",
    "— just resting her eyes — HELLO~",
    "Hmm~? Oh! You came back ♡",
    "Five more minutes— wait, is that YOU?",
    "Pfft~ princess doesn't sleep, she recharges. Anyway. Hi.",
  ],
}

export function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}
