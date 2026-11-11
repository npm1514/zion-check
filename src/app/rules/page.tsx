import Link from 'next/link';

export default function RulesPage() {
  return (
    <div className="min-h-screen bg-green-900 p-6">
      <div className="w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-8">
        <div className="mb-8 flex justify-between items-center">
          <h1 className="text-3xl font-black">Zion&apos;s Check Rules</h1>
          <Link
            href="/"
            className="px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
          >
            ← Home
          </Link>
        </div>

        <div className="space-y-8 text-gray-700">

          {/* Overview */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Overview</h2>
            <p className="text-sm leading-relaxed">
              Zion&apos;s Check is a family Shanghai Rummy variant for 2–8 players, played over
              7 rounds (numbered 6–12). Each round has a <strong>contract</strong> — a specific
              combination of sets and runs — that you must lay down before you can go out.
              Lowest cumulative score wins.
            </p>
          </section>

          {/* Deck */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-2">The Deck</h2>
            <p className="text-sm">
              <strong>2–4 players:</strong> 2 standard decks + 4 jokers (108 cards total).<br />
              <strong>5–8 players:</strong> 3 standard decks + 6 jokers (162 cards total).
            </p>
          </section>

          {/* Dealing */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Dealing</h2>
            <p className="text-sm mb-3">
              The dealer rotates each round — whoever dealt in Round 6 sits out of dealing in Round 7,
              and so on. The player after the dealer goes first.
            </p>

            <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm">
              <strong>✂️ Cutting the Deck:</strong> Before each deal, the dealer cuts the deck using
              a slider. If the cut leaves exactly enough cards to deal everyone their full hand with
              zero left over — a <strong>Perfect Cut</strong> — the dealer earns a <strong>−25 point
              bonus</strong> on that round&apos;s score.
            </div>

            <p className="text-sm">Each round deals one more card than the last, starting with 6 in Round 6 and ending with 12 in Round 12.</p>
          </section>

          {/* Contracts */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Contracts</h2>
            <p className="text-sm mb-2">
              You must lay down your contract before you can go out or add cards to melds.
              After laying your contract, you cannot add to melds until your next turn.
            </p>
            <div className="space-y-1 text-sm mb-4">
              {[
                ['Round 6',  '2 Sets of 3'],
                ['Round 7',  '1 Set of 3 + 1 Run of 4'],
                ['Round 8',  '2 Runs of 4'],
                ['Round 9',  '3 Sets of 3'],
                ['Round 10', '2 Sets of 3 + 1 Run of 4'],
                ['Round 11', '1 Set of 3 + 2 Runs of 4'],
                ['Round 12', '3 Runs of 4'],
              ].map(([round, contract]) => (
                <div key={round} className="flex justify-between bg-gray-50 rounded px-3 py-1.5">
                  <span className="font-medium w-24">{round}</span>
                  <span className="text-gray-600">{contract}</span>
                </div>
              ))}
            </div>
            <div className="text-sm space-y-1.5">
              <p><strong>Set:</strong> 3 or more cards of the same rank (e.g., three 8s). Duplicate suits are allowed — two 8♠ from different decks counts.</p>
              <p><strong>Run:</strong> 4 or more consecutive cards of the same suit (e.g., 5–6–7–8 of Hearts). Ace can be <em>high</em> (…Q–K–A) or <em>low</em> (A–2–3–4), but not both ends.</p>
              <p><strong>Jokers</strong> are wild and can substitute any card in a set or run.</p>
            </div>
          </section>

          {/* Taking a turn */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Taking a Turn</h2>
            <ol className="list-decimal list-inside space-y-1.5 text-sm">
              <li>Draw a card from the deck, or take the top card from the discard pile.</li>
              <li>Optionally lay down your contract melds (if not yet done).</li>
              <li>Optionally add cards to any melds on the table — only available if your contract is already down <em>and</em> you did not lay it this turn.</li>
              <li>Discard one card to end your turn. You cannot draw from the deck on your next turn if your contract is already met.</li>
            </ol>
          </section>

          {/* Buying */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Buying</h2>
            <p className="text-sm leading-relaxed">
              When it&apos;s not your turn and a card is discarded, you may <strong>buy</strong> it —
              take that card plus one penalty card drawn from the deck. The active player then draws
              from the deck as normal. Only one player may buy per discard. In <strong>Round 12,
              each player may only buy once</strong> per round.
            </p>
          </section>

          {/* Joker Swap */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Joker Swap</h2>
            <p className="text-sm leading-relaxed">
              Any player who holds the exact card a joker is substituting in a meld on the table
              may swap their real card for that joker at <em>any time</em> — even outside their
              turn. The joker then returns to their hand for future use. Swappable slots are
              highlighted with a <strong className="text-green-700">⇄</strong> badge.
            </p>
          </section>

          {/* Discard rules */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Discard Rules</h2>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>You <strong>cannot discard a Joker</strong>.</li>
              <li>You <strong>cannot discard a card that could replace a Joker</strong> in a meld on the table — you must swap it out instead.</li>
            </ul>
          </section>

          {/* Scoring */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Scoring</h2>
            <p className="text-sm mb-3">
              When a player goes out (discards their last card after meeting their contract),
              all other players count the penalty points left in their hands. Lowest total after
              all 7 rounds wins.
            </p>
            <div className="grid grid-cols-2 gap-2 text-sm max-w-xs mb-3">
              {[
                ['2 – 9',       '5 pts each'],
                ['10, J, Q, K', '10 pts each'],
                ['Ace',         '15 pts'],
                ['Joker',       '50 pts'],
              ].map(([card, pts]) => (
                <div key={card} className="flex justify-between bg-gray-50 rounded px-3 py-1">
                  <span className="font-medium">{card}</span>
                  <span>{pts}</span>
                </div>
              ))}
            </div>
            <p className="text-sm">
              <strong>Perfect Cut bonus:</strong> −25 pts off the dealer&apos;s score for that round
              (can result in a negative round score).
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
