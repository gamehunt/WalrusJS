import Mexp from 'math-expression-evaluator';
import { randint } from './util.js';

const mexp = new Mexp();

const dice_regex = /(\d*)d(\d+)((?:d[lh]?\d+)?)/g;
const list_regex = /^(\d*)l(u?)\[(.+)\]/;
const init_regex = /^init\[((?:\([^;]+;\s*[+-]?\d+[+-]?\)\s*,?\s*)+)\]/;
const init_contestant_regex = /\(([^;]+);\s*([+-]?\d+)([+-]?)\)/;
const expr_comment_regex = /;(.*)$/;
const list_comment_regex = /\]\s*;(.*)$/;


function format_contestant(c) {
    if (c.subs.length == 1) {
        return `${c.name} (${c.result})`;
    }
    else {
        return `${c.name} (${c.result} ⟵ [${c.subs.join(', ')}])`;
    }
}

function eval_init(content) {
    const contestants_list = content.match(init_regex)[1].split(',');
    const contestants = [];

    for (const c of contestants_list) {
        const c_match = c.match(init_contestant_regex);
        const name = c_match[1].trim();
        const mod = parseInt(c_match[2]);
        contestants.push({ name: name, mod: mod, adv: c_match[3] });
    }

    let results = [];

    for (const c of contestants) {
        let r = randint(1, 21) + c.mod;
        let subr = [r];
        if (c.adv) {
            const r2 = randint(1, 21) + c.mod;
            subr.push(r2);
            if (c.adv == '+') {
                r = Math.max(r, r2);
            }
            else {
                r = Math.min(r, r2);
            }
        }
        subr = subr.sort((a, b) => b - a);
        results.push({ name: c.name, subs: subr, result: r, mod: c.mod });
    }

    results = results.sort((a, b) => a.result != b.result ? b.result - a.result : b.mod - a.mod)
                     .map(c => format_contestant(c));

    return `__${results.join(' - ')}__`;
}

function eval_list(content) {
    let comment = content.match(list_comment_regex);
    if (comment) {
        content = content.replace(comment[0].substring(1), '');
        comment = comment[1];
    }

    const list = content.match(list_regex);
    const amount = list[1].length == 0 ? 1 : parseInt(list[1]);
    const unique = list[2].length > 0;
    const elements = list[3].split(';')
                        .map(value => value.trim())
                        .map(value => ({ value, sort: Math.random() }))
                        .sort((a, b) => a.sort - b.sort)
                        .map(({ value }) => value); // Shuffle
    let r = null;
    if (unique) {
        r = elements.slice(-amount).join('; ');
    }
    else {
        r = [];
        for (let i = 0; i < amount; i++) {
            r.push(elements[randint(0, elements.length)]);
        }
        r = r.join('; ');
    }
    if (comment) {
        return `${comment}, \` ${r} \` ⟵ ${content}`;
    }
    else {
        return `\` ${r} \` ⟵ ${content}`;
    }
}

function eval_expr(content) {
    let comment = content.match(expr_comment_regex);
    if (comment) {
        content = content.replace(comment[0], '');
        comment = comment[1];
    }
    let copy = content;
    const dices = [...content.matchAll(dice_regex)];
    if (dices.length == 0) {
        if (content[0] == '&' || content[0] == 'r') {
            content = content.substring(1);
        }
        else {
            return null;
        }
    }
    const replacement_map = {};
    let index = 0;
    for (const dice of dices) {
        const amount = dice[1].length == 0 ? 1 : parseInt(dice[1]);
        const sides = parseInt(dice[2]);
        const extra = dice[3];
        let sr = [];
        for (let i = 0; i < amount; i += 1) {
            sr.push(randint(1, sides + 1));
        }
        sr = sr.sort((a, b) => b - a);
        let vsr = sr.map(t => t == 1 || t == sides ? `**${t}**` : `${t}`);
        let r = 0;
        if (extra) {
            const mod = extra[1];
            const val = (mod == 'l' || mod == 'h') ? parseInt(extra.substring(2)) :
                                                     parseInt(extra.substring(1));
            if (mod != 'h') {
                r = sr.reduce((partialSum, a, i) => i < sr.length - val ? partialSum + a : partialSum, 0);
                vsr = vsr.map((t, i) => i < sr.length - val ? t : `~~${t}~~`);
            }
            else {
                r = sr.reduce((partialSum, a, i) => i >= val ? partialSum + a : partialSum, 0);
                vsr = vsr.map((t, i) => i >= val ? t : `~~${t}~~`);
            }
        }
        else {
            r = sr.reduce((partialSum, a) => partialSum + a, 0);
        }
        replacement_map[index] = `[${vsr.join(', ')}] ${dice[0]}`;
        copy = copy.replace(dice[0], `dice_${index}`);
        index++;
        content = content.replace(dice[0], r.toString());
    }

    for (let i = 0; i < index; i++) {
        copy = copy.replace(`dice_${i}`, replacement_map[i]);
    }

    const result = mexp.eval(content);

    if (comment) {
        return `${comment}, \` ${result} \` ⟵ ${copy}`;
    }
    else {
        return `\` ${result} \` ⟵ ${copy}`;
    }
}

export function evaluate(content) {
    const amountMatch = content.match(/^(\d+)#(.*)/);
    if (amountMatch) {
        const amount = parseInt(amountMatch[1]);
        const expr = amountMatch[2];
        let result = '';
        for (let i = 0; i < amount; i++) {
            result += evaluate(expr).trim() + '\n';
        }
        return result;
    }
    else if (list_regex.test(content)) {
        return eval_list(content);
    }
    else if (init_regex.test(content)) {
        return eval_init(content);
    }
    else {
        return eval_expr(content);
    }
}
