// 병과 분류
const Dhero = ["헥터", "아모세", "로건", "플린트", "제로니모", "나탈리아", "세르게이", "유진", "스미스"];
const Lhero = ["노라", "레이나", "미야", "필리", "몰리", "제시", "료우키", "보겐", "찰리", "패트릭"];
const Mhero = ["그웬", "린", "그렉", "알론소", "진먼", "바히티", "제셀", "서윤", "지나", "클로리스"];
const Firsthero = ["제시", "제셀", "서윤", "제로니모", "린", "필리", "레이나"];

const heroTable = document.getElementById("heroTable");
const calculateButton = document.getElementById("calculateButton");
const btnResetExplain = document.getElementById("btnResetExplain");
const inputLeaderHero = document.getElementById("inputLeaderHero");
const inputDefenseHero = document.getElementById("inputDefenseHero");
const explainSpans = Array.from({ length: 7 }, (_, i) => document.getElementById(`explain${i}`));

let NumberHero = [];

// 셀 클릭 처리
heroTable.querySelectorAll("td").forEach((cell) => {
  const name = cell.textContent.trim();
  if (!name) return;

  cell.addEventListener("click", () => {
    const leaderText = inputLeaderHero.value.trim();
    const defenseText = inputDefenseHero.value.trim();

    let leaderNames = leaderText.replace(/[/,]/g, " ").split(/\s+/).map(n => n.trim()).filter(n => n);
    let defenseNames = defenseText.replace(/[/,]/g, " ").split(/\s+/).map(n => n.trim()).filter(n => n);

    if (leaderNames.length === 1 && leaderNames[0].length > 2) {
      const flatText = leaderNames[0];
      leaderNames = [...Dhero, ...Lhero, ...Mhero].filter(hero => flatText.split(" ").includes(hero));
    }

    if (defenseNames.length === 1 && defenseNames[0].length > 2) {
      const flatText = defenseNames[0];
      defenseNames = [...Dhero, ...Lhero, ...Mhero].filter(hero => flatText.split(" ").includes(hero));
    }

    const blockedHeroes = new Set([...leaderNames, ...defenseNames]);
    if (blockedHeroes.has(name)) {
      alert("입력된 리더/수비 영웅은 선택할 수 없습니다.");
      return;
    }

    const index = NumberHero.indexOf(name);
    if (index > -1) {
      NumberHero.splice(index, 1);
      cell.classList.remove("selected");
      cell.removeAttribute("data-order");
    } else {
      NumberHero.push(name);
      cell.classList.add("selected");
      cell.setAttribute("data-order", NumberHero.length);
    }

    // 차단된 영웅 자동 해제
    heroTable.querySelectorAll("td").forEach((c) => {
      const heroName = c.textContent.trim();
      if (blockedHeroes.has(heroName)) {
        const i = NumberHero.indexOf(heroName);
        if (i > -1) NumberHero.splice(i, 1);
        c.classList.remove("selected");
        c.removeAttribute("data-order");
      }
    });

    // 순서 갱신
    heroTable.querySelectorAll("td").forEach((c) => {
      const n = c.textContent.trim();
      const i = NumberHero.indexOf(n);
      if (i > -1) {
        c.setAttribute("data-order", i + 1);
      } else {
        c.removeAttribute("data-order");
      }
    });
  });
});

// 병과 필터 함수
function isD(hero) { return Dhero.includes(hero); }
function isL(hero) { return Lhero.includes(hero); }
function isM(hero) { return Mhero.includes(hero); }

function generateGroups(heroes) {
  const D = heroes.filter(isD);
  const L = heroes.filter(isL);
  const M = heroes.filter(isM);
  return [D, M, L];
}

function tryGroup(Dlist, Mlist, Llist, usedSet, maxRetry = 5) {
  let skipSet = new Set();
  let retry = 0;

  while (retry <= maxRetry) {
    const D = Dlist.find(h => !usedSet.has(h) && !skipSet.has(h));
    const M = Mlist.find(h => !usedSet.has(h) && !skipSet.has(h));
    const L = Llist.find(h => !usedSet.has(h) && !skipSet.has(h));
    if (!D || !M || !L) break;

    const group = [D, M, L].filter(Boolean);
    const order = NumberHero.filter(h => group.includes(h));
    const A = order[0], B = order[1], C = order[2];

    if (Firsthero.includes(A)) {
      return { group: order, text: `<span class="text-blue-600">- ${order.join(", ")} : 자동 집결 참여</span>`, used: new Set(order) };
    }

    const BC = [B, C].filter(h => Firsthero.includes(h));
    if (BC.length > 0 && retry < maxRetry) {
      BC.forEach(h => skipSet.add(h));
      retry++;
      continue;
    }

    return {
      group: order,
      text: `<span class="text-red-500">- ${order.join(", ")} : 가까운 깃발에 버려두기</span>`,
      used: new Set(order)
    };
  }

  return null;
}

// 계산 버튼
calculateButton.addEventListener("click", () => {
  const results = [];
  const used = new Set();

  for (let g = 0; g < 6; g++) {
    const available = NumberHero.filter(h => !used.has(h));
    const [Dlist, Mlist, Llist] = generateGroups(available);
    const result = tryGroup(Dlist, Mlist, Llist, used, 5 - g);
    if (result) {
      results.push(result.text);
      result.used.forEach(h => used.add(h));
    } else {
      results.push("");
    }
  }

  explainSpans.forEach((span, i) => span.innerHTML = results[i] || "");
  postprocessExplainTexts();
});

// 후처리
function postprocessExplainTexts() {
  const discardText = "가까운 깃발에 버려두기";
  const fallbackText = "나머지 행군은 부대 지정 or 병사만 참여";
  const banText = "자동집결 권장 X";

  const texts = explainSpans.map(span => span.textContent.trim());

  if (texts.every(t => t.endsWith(discardText))) {
    for (let i = 1; i <= 5; i++) explainSpans[i].textContent = "";
    explainSpans[0].textContent = banText;
    return;
  }

  let i = 5;
  while (i >= 0 && texts[i].endsWith(discardText)) i--;

  const fallbackIndex = i + 1;
  if (fallbackIndex <= 5) {
    explainSpans[fallbackIndex].textContent = fallbackText;
    for (let j = fallbackIndex + 1; j <= 5; j++) {
      explainSpans[j].textContent = "";
    }
  }
}

// 리셋 버튼
btnResetExplain.addEventListener("click", () => {
  explainSpans.forEach(span => span.textContent = "");
  inputLeaderHero.value = "";
  inputDefenseHero.value = "";
  NumberHero = [];
  heroTable.querySelectorAll("td").forEach(cell => {
    cell.classList.remove("selected");
    cell.removeAttribute("data-order");
  });
});

// 리더 입력 변경 시 선택 자동 해제
inputLeaderHero.addEventListener("input", () => {
  const leaderText = inputLeaderHero.value.trim();
  let leaderNames = leaderText.replace(/[/,]/g, " ").split(/\s+/).map(n => n.trim()).filter(n => n);

  if (leaderNames.length === 1 && leaderNames[0].length > 2) {
    const flatText = leaderNames[0];
    leaderNames = [...Dhero, ...Lhero, ...Mhero].filter(hero => flatText.split(" ").includes(hero));
  }

  heroTable.querySelectorAll("td").forEach((cell) => {
    const heroName = cell.textContent.trim();
    if (leaderNames.includes(heroName)) {
      const i = NumberHero.indexOf(heroName);
      if (i > -1) {
        NumberHero.splice(i, 1);
        cell.classList.remove("selected");
        cell.removeAttribute("data-order");
      }
    }
  });

  // 순서 재정렬
  heroTable.querySelectorAll("td").forEach((c) => {
    const n = c.textContent.trim();
    const i = NumberHero.indexOf(n);
    if (i > -1) {
      c.setAttribute("data-order", i + 1);
    } else {
      c.removeAttribute("data-order");
    }
  });
});

// 수비영웅 입력 시 자동 해제
inputDefenseHero.addEventListener("input", () => {
  const defenseText = inputDefenseHero.value.trim();
  let defenseNames = defenseText.replace(/[/,]/g, " ").split(/\s+/).map(n => n.trim()).filter(n => n);

  if (defenseNames.length === 1 && defenseNames[0].length > 2) {
    const flatText = defenseNames[0];
    defenseNames = [...Dhero, ...Lhero, ...Mhero].filter(hero => flatText.split(" ").includes(hero));
  }

  heroTable.querySelectorAll("td").forEach((cell) => {
    const heroName = cell.textContent.trim();
    if (defenseNames.includes(heroName)) {
      const i = NumberHero.indexOf(heroName);
      if (i > -1) {
        NumberHero.splice(i, 1);
        cell.classList.remove("selected");
        cell.removeAttribute("data-order");
      }
    }
  });

  // 순서 재정렬
  heroTable.querySelectorAll("td").forEach((c) => {
    const n = c.textContent.trim();
    const i = NumberHero.indexOf(n);
    if (i > -1) {
      c.setAttribute("data-order", i + 1);
    } else {
      c.removeAttribute("data-order");
    }
  });
});