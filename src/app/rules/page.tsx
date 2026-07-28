import Link from 'next/link';

export default function RulesPage() {
  return (
    <div className="min-h-screen bg-green-900 p-8">
      <div className="w-full max-w-3xl mx-auto bg-white rounded-2xl shadow-xl p-8">
        <div className="mb-8 flex justify-between items-center">
          <h1 className="text-3xl font-black">🃏 Zion&apos;s Check Rules</h1>
          <Link
            href="/"
            className="px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
          >
            ← Back to Home
          </Link>
        </div>

        <div className="space-y-6 text-gray-700">
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Overview</h2>
            <p>
              Zion&apos;s Check is a family Shanghai Rummy variant for 2–8 players played over
              10 rounds. Each round has a &quot;contract&quot; — a specific combination of sets
              and runs — that you must lay down before you can go out. Lowest score wins.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Dealing</h2>
            <p>The number of cards dealt increases each round:</p>
            <div className="mt-2 grid grid-cols-2 gap-1 text-sm max-w-xs">
              {[
                ['Round 1', '6 cards'], ['Round 2', '7 cards'],
                ['Round 3', '8 cards'], ['Round 4', '9 cards'],
                ['Round 5', '10 cards'], ['Round 6', '11 cards'],
                ['Round 7', '12 cards'], ['Round 8', '13 cards'],
                ['Round 9', '14 cards'], ['Round 10', '15 cards'],
              ].map(([round, cards]) => (
                <div key={round} className="flex justify-between bg-gray-50 rounded px-3 py-1">
                  <span className="font-medium">{round}</span>
                  <span>{cards}</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Contracts</h2>
            <p className="mb-2">Each round requires you to lay down a specific contract before going out:</p>
            <div className="space-y-1 text-sm">
              {[
                ['Round 1', '2 Sets of 3'],
                ['Round 2', '1 Set of 3 + 1 Run of 4'],
                ['Round 3', '2 Runs of 4'],
                ['Round 4', '3 Sets of 3'],
                ['Round 5', '2 Sets of 3 + 1 Run of 4'],
                ['Round 6', '1 Set of 3 + 2 Runs of 4'],
                ['Round 7', '3 Runs of 4'],
                ['Round 8', '3 Sets of 3 + 1 Run of 4'],
                ['Round 9', '2 Sets of 3 + 2 Runs of 4'],
                ['Round 10', '3 Runs of 4'],
              ].map(([round, contract]) => (
                <div key={round} className="flex justify-between bg-gray-50 rounded px-3 py-1.5">
                  <span className="font-medium w-24">{round}</span>
                  <span className="text-gray-600">{contract}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 text-sm space-y-1">
              <p><strong>Set:</strong> 3 or more cards of the same rank (e.g., three 8s). No duplicate suits.</p>
              <p><strong>Run:</strong> 4 or more consecutive cards of the same suit (e.g., 5–6–7–8 of Hearts).</p>
              <p><strong>Jokers</strong> are wild and can substitute for any card in a set or run.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Taking a Turn</h2>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Draw a card from the deck, or take the top card from the discard pile.</li>
              <li>Optionally lay down your contract melds (if not yet done).</li>
              <li>Optionally add cards to any melds on the table (only after your contract is down).</li>
              <li>Discard one card to end your turn.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Buying</h2>
            <p className="text-sm">
              When it&apos;s not your turn and a card is discarded, you may <strong>buy</strong> it —
              take that card plus one penalty card from the deck. The active player then draws from
              the deck as normal. In <strong>Round 10, each player may only buy once</strong>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Discard Rules</h2>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>You <strong>cannot discard a Joker</strong>.</li>
              <li>You <strong>cannot discard a card that could replace a Joker</strong> in a meld on the table — you must use it to swap out the Joker instead.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Scoring</h2>
            <p className="text-sm mb-2">
              When a player goes out, all other players count the points left in their hands.
              Lower is better.
            </p>
            <div className="grid grid-cols-2 gap-2 text-sm max-w-xs">
              {[
                ['2 – 9', '5 pts each'],
                ['10, J, Q, K', '10 pts each'],
                ['Ace', '15 pts'],
                ['Joker', '50 pts'],
              ].map(([card, pts]) => (
                <div key={card} className="flex justify-between bg-gray-50 rounded px-3 py-1">
                  <span className="font-medium">{card}</span>
                  <span>{pts}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
