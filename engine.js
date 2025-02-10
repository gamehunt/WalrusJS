import Mexp from 'math-expression-evaluator';
import {randint} from './util.js';

const mexp = new Mexp();

const dice_regex = /(\d*)d(\d+)/g;
const list_regex = /(\d*)l\[(.+)\]/g;

function eval_list(content) {
    const list = content.match(list_regex);
    const amount   = list[1].length == 0 ? 1 : parseInt(list[1]);
    const elements = list[2].split(';')
                        .map(value => ({ value, sort: Math.random() }))
                        .sort((a, b) => a.sort - b.sort)
                        .map(({ value }) => value); // Shuffle
    const r = elements.slice(-amount).join(', ');
    return `${r} ⟵  ${content}`;
}

function eval_expr(content) {
   let copy = content;
   const dices = [...content.matchAll(dice_regex)];
   if(dices.length == 0) {
       if(content[0] == '&' || content[0] == 'r') {
           content = content.substring(1);
       } else {
           return null;
       }
   }
   for(const dice of dices) {
       const amount = dice[1].length == 0 ? 1 : parseInt(dice[1]);
       const sides  = parseInt(dice[2]);

       let sr = [];
       for(let i = 0; i < amount; i += 1) {
           sr.push(randint(1, sides + 1));
       }
       const r = sr.reduce((partialSum, a) => partialSum + a, 0);
       sr = sr.sort((a, b) => b - a).map(t => t == 1 || t == sides ? `**${t}**` : `${t}`);

       copy = copy.replace(dice[0], `[${sr.join(', ')}] $&`);
       content = content.replace(dice[0], r.toString());
   }

   const result = mexp.eval(content);
   
   return `\` ${result} \` ⟵ ${copy}`;
}

export function evaluate(content) {
    const amountMatch = content.match(/^(\d+)#(.*)/);
    if (amountMatch) {
        const amount = parseInt(amountMatch[1]);
        const expr   = amountMatch[2];
        let result = '';
        for(let i = 0; i < amount; i++) {
            result += evaluate(expr) + '\n';
        }
        return result;
    } else if (content.test(list_regex)) {
        return eval_list(content);
    } else {
        return eval_expr(content);
    }
}
