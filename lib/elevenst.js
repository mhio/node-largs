
class Elevenst {

  static numToWord(num){

    let strnum = String(num)
    let two = strnum.slice(-2)
    switch(two){
      case 11: return strnum+'th'
      case 12: return strnum+'th'
      case 13: return strnum+'th'
    }
    let one = strnum.slice(-1)
    switch(one){
      case 1: return strnum+'st'
      case 2: return strnum+'nd'
      case 3: return strnum+'rd'
      default: return strnum+'th'
    }
  }

  static wordToNum(strnum){
    let num = parseInt(strnum)
    if ( isNaN(num) ) throw new Error(`Can't convert ${strnum} to interger`)
    return num
  }

}

module.exports = {Elevenst}
