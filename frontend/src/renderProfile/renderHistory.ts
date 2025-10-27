export function renderHistory() : string{
    return `
      <div class="bg-cyan-900/30 border-4 text-center border-cyan-800 rounded-3xl p-[3vh] 
                  shadow-xl w-[30vw] h-full flex flex-col">
        <h3 class="font-bit text-[3vh] text-gray-100 mb-[2vh]">Match History</h3>

        <div class="grid grid-cols-[1fr,1fr,1fr] font-bit text-[2vh] 
                    text-gray-300 px-3 py-2 border-b border-cyan-800">
          <span>Opp</span>
          <span>Res</span>
          <span>Date</span>
        </div>

        <div id="matchHistoryList" 
            class="divide-y divide-cyan-800 overflow-y-auto flex-1 min-h-0">
          <div id="matchHistory" class="w-full p-3 bg-cyan-900/30 rounded-xl"></div>
        </div>
      </div>
    </div>`
}