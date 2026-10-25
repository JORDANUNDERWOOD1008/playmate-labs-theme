/* Cuff'd (DRAFT) deck, v3.
   c = how you're cuffed for the card: 'together' (wrist to wrist with your partner), 'solo' (the cuffed player's
   own wrists, in front) or 'any' (works either way). Team games use together + any; head to head uses solo + any.
   p = deck type. s = seconds. up = optional "turn it up" line (the flirty layer).
   cx = the complications that suit this card (only these can be drawn, plus "as it comes"). Ids are in
   `complications`. Written so a twist always makes the card harder or funnier, never pointless or unsafe
   (no blindfolds near kettles, no ankle cuffs for walking tasks on hard floors, and so on).
   UK English, no em dashes, cheeky but never explicit. Every card is optional. */
window.CUFFD_CARDS = {
  types: {
    cuffs: {name: 'cuffed', ico: 'cuffs'},
    blind: {name: 'blindfolded', ico: 'blind'},
    draw: {name: 'draw it blind', ico: 'pencil'},
    duel: {name: 'duel', ico: 'bolt'},
    act: {name: 'act it out', ico: 'mask'},
    talk: {name: 'hot seat', ico: 'mic'}
  },
  /* the twists, each written for both ways of being cuffed where it can be */
  complications: {
    ankle: {t: 'ankle to wrist', ico: 'cuffs', together: 'Swap the cuffs to your ankle and their wrist.', solo: 'One wrist cuffed to your own ankle. Sit down for this one.'},
    legs: {t: 'ankle to ankle', ico: 'cuffs', together: 'Three-legged race rules: your ankle cuffed to theirs.'},
    behind: {t: 'behind your back', ico: 'cuffs', solo: 'Cuffs move behind your back.'},
    blind: {t: 'blindfold on', ico: 'blind', together: 'Whoever leads wears the blindfold.', solo: 'You wear the blindfold too.'},
    wrong: {t: 'wrong hand', ico: 'hand', together: 'Your free hand is your wrong hand. Swap sides if you need to.', solo: 'Lead with your non-dominant hand.'},
    silent: {t: 'not a word', ico: 'shh', together: 'Total silence. Grunts are allowed. Just.', solo: 'Total silence, from both of you.'},
    slow: {t: 'slow motion', ico: 'clock', together: 'Every move at half speed. Dramatically.', solo: 'Every move at half speed. Dramatically.'},
    hands: {t: 'they\'re your hands', ico: 'hand', together: 'You can talk. Only your partner can touch anything.'}
  },
  /* the separate complication deck (draw one per challenge; if its type isn't on the challenge card, draw again) */
  compDeck: [
    {k: 'ankle', t: 'ankle to wrist', together: 'Your ankle, their wrist. Hop to it.', solo: 'One wrist to your own ankle. Sit down for this one.'},
    {k: 'ankle', t: 'ankle to wrist, swapped', together: 'Their ankle, your wrist. They lead from the floor.', solo: 'Your other wrist to your other ankle. Sit down.'},
    {k: 'legs', t: 'three-legged', together: 'Ankle to ankle. Walk it like a race.'},
    {k: 'legs', t: 'ankle to ankle, backwards', together: 'Ankle to ankle, standing back to back.'},
    {k: 'behind', t: 'behind your back', solo: 'Cuffs move behind your back.'},
    {k: 'behind', t: 'behind your back, kneeling', solo: 'Cuffs behind your back, and you stay on your knees.'},
    {k: 'blind', t: 'blindfold on', together: 'Whoever leads wears the blindfold.', solo: 'You wear the blindfold too.'},
    {k: 'blind', t: 'blindfold swap', together: 'The one who isn\'t leading wears the blindfold and does the talking.', solo: 'The warden wears the blindfold and gives the directions.'},
    {k: 'blind', t: 'eyes shut, no peeking', together: 'Both of you, eyes shut. No blindfold, all honour.', solo: 'Eyes shut, no blindfold. The warden is watching.'},
    {k: 'wrong', t: 'wrong hand', together: 'Your free hand is your wrong hand. Swap sides if you need to.', solo: 'Lead with your non-dominant hand.'},
    {k: 'wrong', t: 'one finger and a thumb', together: 'Free hands only use a finger and a thumb.', solo: 'Finger and thumb only, both hands.'},
    {k: 'silent', t: 'not a word', together: 'Total silence. Grunts are allowed. Just.', solo: 'Total silence, from both of you.'},
    {k: 'silent', t: 'whisper only', together: 'Everything has to be whispered.', solo: 'Everything has to be whispered, warden included.'},
    {k: 'silent', t: 'questions only', together: 'You can only speak in questions.', solo: 'You can only speak in questions.'},
    {k: 'slow', t: 'slow motion', together: 'Every move at half speed. Dramatically.', solo: 'Every move at half speed. Dramatically.'},
    {k: 'slow', t: 'freeze', together: 'Whenever the warden or your partner says freeze, you freeze for three seconds.', solo: 'Whenever the warden says freeze, you freeze for three seconds.'},
    {k: 'hands', t: 'they\'re your hands', together: 'You can talk. Only your partner can touch anything.'},
    {k: 'hands', t: 'puppet master', together: 'Your partner moves your free hand for you. You just narrate.'},
    {k: 'none', t: 'as it comes', together: 'No twist. Lucky you.', solo: 'No twist. Lucky you.'},
    {k: 'none', t: 'as it comes', together: 'No twist. Enjoy it while it lasts.', solo: 'No twist. Enjoy it while it lasts.'}
  ],
  challenges: [
    /* cuff'd together */
    {p: 'cuffs', c: 'together', s: 60, t: 'cut the toast in half', how: 'Butter it and cut it straight down the middle. Cuffed hands stay out of it.', up: 'Feed each other the first bite.', cx: ['wrong', 'slow', 'silent', 'hands']},
    {p: 'cuffs', c: 'together', s: 90, t: 'make two cups of tea', how: 'Kettle to mug, milk and all. One free hand each.', up: 'Drink them with your arms linked.', cx: ['silent', 'wrong', 'legs']},
    {p: 'cuffs', c: 'together', s: 60, t: 'tie a shoelace', how: 'The shoe stays on your partner\'s foot. One hand each.', up: 'Kiss the knot when it\'s done.', cx: ['blind', 'wrong', 'silent']},
    {p: 'cuffs', c: 'together', s: 90, t: 'put your jacket on them', how: 'Both arms in, zipped or buttoned. The cuffs stay on. Good luck with the sleeve.', up: 'They have to say thank you properly.', cx: ['blind', 'slow', 'silent']},
    {p: 'cuffs', c: 'together', s: 60, t: 'peel an orange', how: 'One long strip if you can manage it, then share every segment.', up: 'Pass the last segment without using your hands.', cx: ['blind', 'wrong', 'hands']},
    {p: 'cuffs', c: 'together', s: 90, t: 'wrap a present', how: 'Anything in the room, any paper, finished with a bow.', up: 'Whoever tied the bow worse owes the other a kiss.', cx: ['blind', 'silent', 'wrong', 'hands']},
    {p: 'cuffs', c: 'together', s: 30, t: 'open a jar and close it again', how: 'One hand each on the lid, one on the jar.', up: 'A 10-second kiss to celebrate.', cx: ['ankle', 'blind', 'wrong']},
    {p: 'cuffs', c: 'together', s: 60, t: 'write a love note', how: 'One pen, both your free hands on it, one full sentence.', up: 'Read it out in your most dramatic voice.', cx: ['blind', 'wrong', 'silent']},
    {p: 'cuffs', c: 'together', s: 60, t: 'build a tower of 8 things', how: 'Anything in the room. It has to stand for three seconds.', up: 'A kiss before every item goes on.', cx: ['legs', 'blind', 'slow', 'silent']},
    {p: 'cuffs', c: 'together', s: 45, t: 'take the perfect couple selfie', how: 'Both in frame, one hand each on the phone. The last shot counts.', up: 'Make it a kissing selfie.', cx: ['ankle', 'legs', 'silent']},
    {p: 'cuffs', c: 'together', s: 60, t: 'make a paper plane and fly it', how: 'Fold it together. It has to cross the room.', up: 'Write a dare on it first. Whoever it lands nearest does it.', cx: ['blind', 'wrong', 'slow', 'hands']},
    {p: 'cuffs', c: 'together', s: 45, t: 'fold a t-shirt, shop perfect', how: 'Sleeves in, edges straight. One free hand each.', up: 'Then fold it again with your eyes closed.', cx: ['blind', 'silent', 'hands']},
    {p: 'cuffs', c: 'together', s: 45, t: 'brush your partner\'s hair', how: 'A neat parting. The brusher uses their cuffed hand only.', up: 'Finish with a kiss on the forehead.', cx: ['blind', 'slow', 'silent']},
    {p: 'cuffs', c: 'together', s: 60, t: 'send a text to a friend', how: 'One thumb each. It has to make sense. Send it.', up: 'The text says something nice about your partner.', cx: ['silent', 'wrong', 'slow']},
    {p: 'cuffs', c: 'together', s: 60, t: 'make one corner of the bed', how: 'A proper hotel corner, sheet tucked tight.', up: 'Then test the bed for ten seconds.', cx: ['legs', 'silent', 'slow']},
    {p: 'cuffs', c: 'together', s: 45, t: 'slow dance through a whole chorus', how: 'Pick the song together. Cuffed hands stay up. No stepping on toes.', up: 'Cheek to cheek.', cx: ['legs', 'blind', 'silent']},
    {p: 'cuffs', c: 'together', s: 90, t: 'lace a shoe, every hole', how: 'From completely unlaced. One hand each.', up: 'The shoe-wearer gets carried to the sofa. Just about.', cx: ['wrong', 'silent', 'hands']},
    {p: 'cuffs', c: 'together', s: 30, t: 'pour two drinks', how: 'Same bottle, one hand each on it, not a drop spilt.', up: 'Toast to something you\'ve never said out loud.', cx: ['wrong', 'slow', 'silent']},
    {p: 'cuffs', c: 'together', s: 45, t: 'do up your partner\'s top button', how: 'Shirt, cardigan or coat. One free hand each.', up: 'Then undo it again.', cx: ['blind', 'wrong', 'hands']},
    {p: 'cuffs', c: 'together', s: 30, t: 'make a heart with your hands', how: 'One hand each, then a photo of it on the phone\'s timer.', up: 'Kiss through the middle of it.', cx: ['ankle', 'legs', 'slow']},
    {p: 'cuffs', c: 'together', s: 45, t: 'dunk a biscuit and share it', how: 'It can\'t break in the mug. Half each.', up: 'Feed each other the halves.', cx: ['wrong', 'slow', 'hands']},
    {p: 'cuffs', c: 'together', s: 60, t: 'find three matching pairs of socks', how: 'From a drawer or the washing pile. Cuffed hands only.', up: 'Loser of the next rock paper scissors puts a pair on the other.', cx: ['legs', 'blind', 'silent']},
    {p: 'cuffs', c: 'together', s: 60, t: 'walk to the kitchen and back', how: 'Carrying a full glass of water between you. Not a drop spilt.', up: 'Whoever spills less drinks it, from the other\'s hand.', cx: ['legs', 'slow', 'silent']},
    /* cuff'd solo: the cuffed player's own wrists, cuffed in front */
    {p: 'cuffs', c: 'solo', s: 90, t: 'put your jacket on', how: 'Wrists cuffed in front. All the way on, zipped or buttoned.', up: 'Then take it off again, slowly.', cx: ['blind', 'slow', 'silent']},
    {p: 'cuffs', c: 'solo', s: 30, t: 'open a jar and close it again', how: 'Wrists cuffed in front. No help.', up: 'Feed your partner whatever was in it.', cx: ['blind', 'behind', 'wrong']},
    {p: 'cuffs', c: 'solo', s: 60, t: 'send a text to a friend', how: 'Wrists cuffed in front. It has to make sense. Send it.', up: 'The text says something nice about your partner.', cx: ['slow', 'silent', 'blind']},
    {p: 'cuffs', c: 'solo', s: 45, t: 'dunk a biscuit and eat it', how: 'Wrists cuffed in front. It can\'t break in the mug.', up: 'Share the last bite.', cx: ['slow', 'ankle', 'wrong']},
    {p: 'cuffs', c: 'solo', s: 60, t: 'tie your own shoelace', how: 'Wrists cuffed in front, shoe on your foot.', up: 'Then tie your partner\'s. Same rules.', cx: ['blind', 'slow', 'silent']},
    {p: 'cuffs', c: 'solo', s: 30, t: 'pour a glass of water', how: 'Wrists cuffed in front, glass full to the brim, not a drop spilt.', up: 'Your partner drinks it however you choose.', cx: ['blind', 'behind', 'slow']},
    {p: 'cuffs', c: 'solo', s: 60, t: 'put on a pair of socks', how: 'Wrists cuffed in front. Both socks, heels in the right place.', up: 'Put them on your partner instead.', cx: ['blind', 'ankle', 'slow']},
    {p: 'cuffs', c: 'solo', s: 60, t: 'build a tower of 8 things', how: 'Wrists cuffed in front. It has to stand for three seconds.', up: 'Your partner gets a kiss for every piece that falls.', cx: ['blind', 'behind', 'slow', 'silent']},
    {p: 'cuffs', c: 'solo', s: 45, t: 'fold a t-shirt, shop perfect', how: 'Wrists cuffed in front. Sleeves in, edges straight.', up: 'The t-shirt has to be one your partner is wearing. They don\'t have to take it off.', cx: ['blind', 'behind', 'silent']},
    {p: 'cuffs', c: 'solo', s: 60, t: 'make a paper plane and fly it', how: 'Wrists cuffed in front. It has to cross the room.', up: 'Write a dare on it first. If it hits your partner, they do it.', cx: ['blind', 'slow', 'wrong']},
    {p: 'cuffs', c: 'solo', s: 60, t: 'peel a satsuma in one piece', how: 'Wrists cuffed in front. Then share it.', up: 'Feed every segment to your partner.', cx: ['blind', 'behind', 'slow']},
    {p: 'cuffs', c: 'solo', s: 30, t: 'strike your best pose', how: 'Wrists cuffed in front. Your partner takes the photo. They decide if it counts.', up: 'Make it a pose they\'ll want to keep.', cx: ['behind', 'ankle', 'blind']},
    {p: 'cuffs', c: 'solo', s: 45, t: 'give your partner a ponytail', how: 'Wrists cuffed in front. Neat, tight, no bumps.', up: 'Finish with a kiss on the neck.', cx: ['blind', 'slow', 'silent']},
    {p: 'cuffs', c: 'solo', s: 90, t: 'wrap a present', how: 'Wrists cuffed in front. Anything in the room, finished with a bow.', up: 'The present is for your partner. Make it a good one.', cx: ['blind', 'silent', 'wrong']},
    {p: 'cuffs', c: 'solo', s: 60, t: 'butter and cut the toast', how: 'Wrists cuffed in front. Straight down the middle.', up: 'Feed your partner the first bite.', cx: ['blind', 'slow', 'wrong']},
    {p: 'cuffs', c: 'solo', s: 45, t: 'do up your partner\'s buttons', how: 'Wrists cuffed in front. Every button on a shirt or cardigan.', up: 'Then undo them again.', cx: ['blind', 'slow', 'silent']},
    {p: 'cuffs', c: 'solo', s: 30, t: 'write "you\'re trouble" neatly', how: 'Wrists cuffed in front. Joined-up, readable, on paper.', up: 'Write it on your partner\'s hand instead.', cx: ['blind', 'wrong', 'behind']},
    {p: 'cuffs', c: 'solo', s: 30, t: 'put lip balm on your partner', how: 'Wrists cuffed in front. No mirror, no smudges.', up: 'Then test it.', cx: ['blind', 'slow', 'behind']},
    /* duels: both ways */
    {p: 'duel', c: 'any', s: 30, t: 'thumb war', how: 'Cuffed hand against free hand if you have to. Best of three.', up: 'The winner names the prize.', cx: ['wrong', 'blind']},
    {p: 'duel', c: 'any', s: 30, t: 'staring contest', how: 'Nose to nose. First to laugh or look away loses.', up: 'The winner steals a kiss.', cx: ['silent']},
    {p: 'duel', c: 'any', s: 30, t: 'rock paper scissors', how: 'Best of five.', up: 'Every win earns a kiss, wherever the winner points.', cx: ['wrong', 'silent', 'slow']},
    {p: 'duel', c: 'any', s: 45, t: 'the alphabet backwards', how: 'Take it in turns, one letter each. First to get it wrong loses.', up: 'Each mistake costs a compliment.', cx: ['slow']},
    {p: 'duel', c: 'any', s: 45, t: 'make the other one laugh', how: 'No touching. First to crack loses.', up: 'Touching allowed. Ticklish people beware.', cx: ['silent']},
    {p: 'duel', c: 'any', s: 45, t: 'compliment-off', how: 'Take turns. First to hesitate or repeat one loses.', up: 'Every compliment has to be about how they look tonight.', cx: ['slow']},
    {p: 'duel', c: 'any', s: 30, t: 'book on your head', how: 'Both balance a book. Last one standing wins.', up: 'The winner gets carried, well, dragged, to the sofa.', cx: ['ankle', 'legs', 'blind']},
    {p: 'duel', c: 'any', s: 45, t: '10 films with a dog in', how: 'Race to name them. The other one checks.', up: 'The loser does the dog voice for the next card.', cx: ['slow']},
    /* blindfolded, both ways */
    {p: 'blind', c: 'any', s: 45, t: 'guess three things by touch', how: 'Blindfolded. Your partner picks three things, you name all three.', up: 'The last thing is part of your partner.', cx: ['wrong', 'behind']},
    {p: 'blind', c: 'any', s: 30, t: 'catch their hand three times', how: 'Blindfolded. They move their free hand around in the air. Catch it.', up: 'Every catch earns a kiss on the palm.', cx: ['wrong', 'silent']},
    {p: 'blind', c: 'any', s: 45, t: 'feed them a grape', how: 'Blindfolded. They guide you by voice only.', up: 'Then they feed you one, no hands.', cx: ['wrong', 'slow']},
    {p: 'blind', c: 'any', s: 60, t: 'guess the taste', how: 'Blindfolded. Your partner gives you three things from the kitchen. Name them.', up: 'The last taste is a kiss. Guess the flavour.', cx: ['silent', 'behind']},
    {p: 'blind', c: 'any', s: 60, t: 'walk to the door and back', how: 'Blindfolded, guided by voice only. Clear the floor first, carpet only.', up: 'They choose the reward at the door.', cx: ['slow', 'silent']},
    {p: 'blind', c: 'any', s: 45, t: 'style their hair', how: 'Blindfolded. It counts if they keep the look for one round.', up: 'The finished look gets a kiss.', cx: ['wrong', 'slow']},
    /* draw it blind, both ways */
    {p: 'draw', c: 'any', s: 45, t: 'the Eiffel Tower', how: 'Blindfold on, pen in hand. Your partner guesses it.', up: 'Wrong guesses cost a kiss each.', cx: ['wrong', 'behind', 'slow']},
    {p: 'draw', c: 'any', s: 45, t: 'a giraffe on a skateboard', how: 'Blindfold on, pen in hand. Your partner guesses it.', up: 'Wrong guesses cost a kiss each.', cx: ['wrong', 'slow', 'silent']},
    {p: 'draw', c: 'any', s: 45, t: 'your partner', how: 'Blindfold on, pen in hand. They have to recognise themselves.', up: 'Sign it with a kiss.', cx: ['wrong', 'behind']},
    {p: 'draw', c: 'any', s: 45, t: 'your first date', how: 'Blindfold on, pen in hand. Your partner guesses where it was.', up: 'Tell them your favourite bit of it.', cx: ['wrong', 'slow']},
    {p: 'draw', c: 'any', s: 45, t: 'a snowman on holiday', how: 'Blindfold on, pen in hand. Your partner guesses it.', up: 'Wrong guesses cost a kiss each.', cx: ['wrong', 'silent', 'behind']},
    {p: 'draw', c: 'any', s: 45, t: 'a cocktail with an umbrella in it', how: 'Blindfold on, pen in hand. Your partner guesses it.', up: 'Make the next drink. Together, obviously.', cx: ['wrong', 'slow']},
    {p: 'draw', c: 'together', s: 45, t: 'a house, a tree and a dog', how: 'One pen held by both of you, both blindfolded. It has to be recognisable.', up: 'Add the two of you to the picture.', cx: ['silent', 'slow']},
    /* act it out, both ways */
    {p: 'act', c: 'together', s: 60, t: 'act out your first date', how: 'Both of you, no words. The phone timer is your audience.', up: 'Act out how it ended.', cx: ['legs', 'slow']},
    {p: 'act', c: 'any', s: 60, t: 'charades: a famous couple', how: 'The cuffed player acts, the other guesses. Pick one: Romeo and Juliet, Wallace and Gromit, Beyonce and Jay-Z.', up: 'Whoever guesses picks a kiss, any famous one.', cx: ['behind', 'ankle', 'slow', 'legs']},
    {p: 'act', c: 'any', s: 60, t: 'charades: a film', how: 'The cuffed player acts, the other guesses. Pick one: Titanic, Jaws, Dirty Dancing.', up: 'Recreate the poster.', cx: ['behind', 'ankle', 'slow', 'legs']},
    /* hot seat, both ways */
    {p: 'talk', c: 'any', s: 45, t: '10 things that make you smile', how: 'List 10 things your partner does. No repeats, no long pauses.', up: 'Pick the best one and show them.', cx: ['slow']},
    {p: 'talk', c: 'any', s: 45, t: 'us, in three words', how: 'Three words each that describe the two of you. Then explain them.', up: 'Seal the best word with a kiss.', cx: []},
    {p: 'talk', c: 'any', s: 60, t: 'remember when', how: 'Your favourite memory of each other, 30 seconds each.', up: 'Recreate one tiny bit of it right now.', cx: []},
    {p: 'talk', c: 'any', s: 45, t: 'the honest answer', how: 'One thing you\'d love to do more of together. Both answer.', up: 'Put it in the diary before the next card.', cx: []}
  ],
  wilds: [
    {t: 'reversal', d: 'The other player leads the next card.', fx: 'swap', team: 1},
    {t: 'not a word', d: 'The next card is played in total silence, on top of everything else.', fx: 'silent'},
    {t: 'half time', d: 'The next card gets half the time, and it\'s worth two keys.', fx: 'half'},
    {t: 'double or nothing', d: 'The next card is worth two keys. Fail it and lose a key as well as the bust.', fx: 'double'},
    {t: 'your partner\'s pick', d: 'Draw three cards. Your partner chooses which one you play.', fx: 'pick'},
    {t: 'lucky break', d: 'A free key. No challenge this round.', fx: 'key'},
    {t: 'clean record', d: 'Wipe one bust off the board.', fx: 'unbust'},
    {t: 'breather', d: 'Cuffs off for one round. Stretch, drink some water, cuff back up. No penalty.', fx: 'breather'}
  ],
  forfeits: [
    {t: 'a 30-second kiss', d: 'The timer is running. No stopping early.'},
    {t: 'whisper it', d: 'Whisper the thing you\'ve been meaning to say.'},
    {t: 'you pick the spot', d: 'Your partner picks where you kiss them. Above the shoulders.'},
    {t: 'slow dance', d: 'To the next song that comes on. Still cuffed.'},
    {t: 'shoulder rub', d: 'Two minutes, cuffs and all.'},
    {t: 'swap one thing', d: 'Swap one item of clothing for the next round.'},
    {t: 'first impressions', d: 'Tell them what you noticed first about them. In detail.'},
    {t: 'it\'s compulsory', d: 'The next turn it up line is not optional.'},
    {t: '10 compliments', d: 'Ten compliments in 30 seconds. No repeats.'},
    {t: 'recreate your first kiss', d: 'Location, nerves, everything.'}
  ]
};
