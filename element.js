function createElement(type, props, ...children){
    return {
        type,
        props: {
            ...props,
            children: children.map(child => 
                typeof child === 'object'
                ? child
                : createTextElement(child)
            )
        }
    }
}

function createTextElement(text){
    return {
        type: 'TEXT_ELEMENT',
        props: {
            nodeValue: text,
            children: []
        }
    }
}

// function render(element, container){
//     const dom = element.type === 'TEXT_ELEMENT' 
//         ? document.createTextNode('')
//         : document.createElement(element.type)
//     Object.entries(element.props).forEach(prop=>{
//         if(prop[0]==='children'){
//             prop[1].forEach(ele=>{
//                 render(ele, dom)
//             })
//         } else {
//             dom[prop[0]] = prop[1]
//         }
//     })
//     container.appendChild(dom)
// }

const myReact = {
    createElement,
    render
}

// const element = myReact.createElement(
//     'div',
//     {id: 'foo'},
//     myReact.createElement('a', {href: 'https://www.baidu.com'}, '白了个度'),
//     'textNode'
// )

// console.log(element)