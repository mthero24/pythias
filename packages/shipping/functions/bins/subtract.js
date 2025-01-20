export function subtract({binCount, newBinCount}){
    let numberOfBinsToRemove= binCount - newBinCount
    console.log(numberOfBinsToRemove);
    let binNumbers = [];
    for (let i = numberOfBinsToRemove; i > 0; i--) {
      binNumbers.push((binCount + 1) - i);
    }
    console.log(binNumbers)
    return binNumbers
}