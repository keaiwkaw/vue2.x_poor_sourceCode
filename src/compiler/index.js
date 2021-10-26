import { generate } from "./generate"
import { parseHTML } from "./parse"

export function compileToFunctions(template) {
  let ast = parseHTML(template)
    //代码生成
  let code = generate(ast)
 let render =  new Function(  `with (this) {
    return ${code}
  }`) 
  // console.log(render);
  return render
}