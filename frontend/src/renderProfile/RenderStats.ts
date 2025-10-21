export function renderStats(wins: number, losses: number, friends: number, tournaments: number, rank:number, medalUrl: string) : string{
    const totalGames = wins + losses;
    const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;
    return `<!-- MIDDLE COLUMN -->
      <div class="flex flex-col gap-[3vh] w-[30vw] h-full">

        <!-- TOP: Game Stats -->
        <div class="flex flex-col items-center bg-cyan-900/30 border-4 border-cyan-800 
                    rounded-3xl p-[3vh] shadow-xl flex-1">
          <h3 class="font-bit text-[3vh] text-gray-100 mb-[2vh]">Game Stats</h3>
          <div class="flex justify-between w-full px-[2vw] font-bit text-[2.5vh]">
            <span class="text-green-400">Wins: ${wins}</span>
            <span class="text-red-400">Losses: ${losses}</span>
          </div>
          <div class="mt-[2vh] w-[90%] bg-red-400 rounded-full h-[2.5vh] overflow-hidden">
            <div class="h-full bg-green-400 transition-all duration-500" 
                style="width: ${Math.max(0, Math.min(100, winRate))}%"></div>
          </div>
          <p class="font-bit text-gray-100 text-[2.2vh] mt-[1vh]">${winRate}% Win Rate</p>
        </div>

        <!-- BOTTOM: Social & Rank -->
        <div class="bg-cyan-900/30 border-4 border-cyan-800 text-center rounded-3xl p-[3vh] 
                    shadow-xl flex-1">
          <h3 class="font-bit text-[3vh] text-gray-100 mb-[2vh]">Social & Rank</h3>
          <div class="grid grid-cols-3 gap-[2vh] text-center h-full">
            <div class="flex flex-col justify-start">
              <span class="font-bit text-gray-300 text-[2.2vh]">Friends</span>
              <span class="font-bit text-[3vh] text-cyan-200">${friends}</span>
            </div>
            <div class="flex flex-col justify-start items-center">
              <span class="font-bit text-gray-300 text-[2.2vh]">Tournaments</span>
              <div class="flex items-center gap-[1vh]">
                <span class="font-bit text-[3vh] text-cyan-200">${tournaments}</span>
                <img src="${medalUrl}" alt="Medal" class="w-[3vh] h-[3vh] inline-block">
              </div>
            </div>
            <div class="flex flex-col justify-start">
              <span class="font-bit text-gray-300 text-[2.2vh]">Rank</span>
              <span class="font-bit text-[3vh] text-amber-300">#${rank}</span>
            </div>
          </div>
        </div>
      </div>
      `;
}