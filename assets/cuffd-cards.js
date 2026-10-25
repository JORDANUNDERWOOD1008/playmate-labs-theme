/* Cuff'd (DRAFT) card content. Decks of challenges, complications that bring in the props
   (cuffs, blindfold), wild cards and forfeits. f: 1 = only in "flirty" games. Cheeky, never explicit.
   UK English, no em dashes. Every card is optional. */
window.CUFFD_CARDS = {
  decks: {
    act: {name: 'act it out', ico: 'mask', time: 60, kind: 'guess', how: 'No words, no pointing at things. Act it, your partner shouts guesses.', cards: [
      {t: 'a cat stuck in a jumper'}, {t: 'assembling flat-pack furniture without the instructions'}, {t: 'a spy defusing a bomb'},
      {t: 'proposing on a rollercoaster'}, {t: 'walking a very strong dog'}, {t: 'the first five minutes of a fancy date'},
      {t: 'a magician whose trick goes wrong'}, {t: 'your partner on a Monday morning'}, {t: 'getting out of a car in a tiny dress'},
      {t: 'a penguin at a job interview'}, {t: 'carrying all the shopping in one trip'}, {t: 'finding a spider in the bath'},
      {t: 'a sommelier tasting a terrible wine'}, {t: 'the moment you first saw your partner', f: 1}, {t: 'a very slow, very dramatic striptease of one glove', f: 1},
      {t: 'trying to look casual when your crush walks in', f: 1}
    ]},
    cuffed: {name: 'cuffed together', ico: 'cuffs', time: 90, kind: 'task', how: 'One of your wrists cuffed to one of theirs. Do it together, beat the clock.', cards: [
      {t: 'make two cups of tea, one each'}, {t: 'peel an orange and share it, segment by segment'}, {t: 'write both your names with one pen held together'},
      {t: 'build a tower of 8 things from the room'}, {t: 'put a pair of socks on one foot each'}, {t: 'fold a t-shirt properly'},
      {t: 'take a selfie in a power pose, both in frame'}, {t: 'make a paper plane that flies across the room'}, {t: 'tie one shoelace, one hand each'},
      {t: 'butter a slice of toast and cut it in half'}, {t: 'slow dance to one whole chorus without stepping on toes', f: 1}, {t: 'feed each other three grapes, no dropping', f: 1}
    ]},
    blind: {name: 'blind guide', ico: 'blind', time: 60, kind: 'task', how: 'One of you is blindfolded. The other guides with their voice only.', cards: [
      {t: 'find a spoon in the kitchen'}, {t: 'guess three objects by touch alone'}, {t: 'pour a glass of water without spilling'},
      {t: 'find a specific book on the shelf'}, {t: 'walk to the front door and back'}, {t: 'stack five coins into a tower'},
      {t: 'put a hat (or anything hat-ish) on your partner'}, {t: 'find your partner in the room by sound alone'}, {t: 'guess what your partner just put in your hand', f: 1},
      {t: 'find their hand, then their nose, then their ear', f: 1}
    ]},
    draw: {name: 'draw it blind', ico: 'pencil', time: 45, kind: 'guess', how: 'Blindfold on, pen in hand. Draw it, your partner guesses.', cards: [
      {t: 'a giraffe on a skateboard'}, {t: 'your house'}, {t: 'a cup of tea'}, {t: 'your partner'}, {t: 'a snowman on holiday'},
      {t: 'the Eiffel Tower'}, {t: 'a fish riding a bike'}, {t: 'your first date'}, {t: 'a cocktail with an umbrella in it'},
      {t: 'the best night you ever had together', f: 1}
    ]},
    duel: {name: 'duel', ico: 'bolt', time: 30, kind: 'duel', versus: 1, how: 'Head to head. Winner takes the round.', cards: [
      {t: 'thumb war, cuffed together'}, {t: 'staring contest, first to laugh loses'}, {t: 'say the alphabet backwards, fastest wins'},
      {t: 'rock paper scissors, best of five, cuffed hands only'}, {t: 'balance a book on your head the longest'}, {t: 'name 10 films with a dog in, fastest wins'},
      {t: 'hold a plank the longest'}, {t: 'make the other one laugh first, no touching', f: 1}, {t: 'compliment-off: last one to run out wins', f: 1}
    ]},
    hot: {name: 'hot seat', ico: 'mic', time: 45, kind: 'task', how: 'Talk, quickly, honestly. Hesitate for 3 seconds and it is over.', cards: [
      {t: '10 things your partner does that make you smile'}, {t: 'every place you have been on a date together'},
      {t: 'your partner\'s order at their favourite takeaway, exactly'}, {t: '5 songs that remind you of them'},
      {t: 'their three biggest pet peeves'}, {t: 'what you noticed first about them', f: 1}, {t: 'your perfect night in, minute by minute', f: 1}
    ]}
  },
  complications: [
    {t: 'cuffed together', d: 'One wrist each, cuffed. You move as one.', ico: 'cuffs'},
    {t: 'blindfold on', d: 'The player doing the card wears the blindfold.', ico: 'blind'},
    {t: 'blindfold swap', d: 'The guesser or helper wears the blindfold instead.', ico: 'blind'},
    {t: 'wrong hand', d: 'Non-dominant hand only.', ico: 'hand'},
    {t: 'not a word', d: 'Total silence. Grunts are allowed. Just.', ico: 'shh'},
    {t: 'whisper only', d: 'Everything has to be whispered.', ico: 'shh'},
    {t: 'slow motion', d: 'Every move at half speed. Dramatically.', ico: 'clock'},
    {t: 'one hand behind your back', d: 'Tucked into your waistband. No cheating.', ico: 'hand'},
    {t: 'your partner is your hands', d: 'You can talk. Only they can touch anything.', ico: 'cuffs'},
    {t: 'pirate rules', d: 'Every word in a pirate accent. Arr.', ico: 'mask'},
    {t: 'half time', d: 'The clock is cut in half.', ico: 'clock'},
    {t: 'no complication', d: 'Lucky. Play it straight.', ico: 'star'}
  ],
  wilds: [
    {t: 'key found', d: 'Free key for the team, or a free point in versus. No challenge this round.', fx: 'key'},
    {t: 'swap roles', d: 'Whoever was going to do the card now guesses, and the other way round.', fx: 'swap'},
    {t: 'lockdown', d: 'This round, both of you wear a complication. Spin twice.', fx: 'double'},
    {t: 'plot twist', d: 'Your partner picks the complication for this round.', fx: 'pick'},
    {t: 'escape artist', d: 'Skip any card this game. Save it for a horrible one.', fx: 'pass'}
  ],
  forfeits: [
    {t: 'makes breakfast tomorrow'}, {t: 'gives a 10-minute shoulder rub'}, {t: 'hands over the remote for the week'},
    {t: 'plans the next date, start to finish'}, {t: 'does the washing up for three days'}, {t: 'sings the winner a song of their choice'},
    {t: 'recreates the winner\'s favourite photo, pose and all'}, {t: 'slow dances with the winner to one song of their choice', f: 1},
    {t: 'stays cuffed to the winner for the next 10 minutes', f: 1}, {t: 'gives the winner a kiss anywhere but the lips (hand, cheek, forehead...)', f: 1}
  ]
};
