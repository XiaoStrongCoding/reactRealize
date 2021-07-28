/**
 * createDom 创建 DOM 节点
 * @param { fiber } fiber 节点
 * @return {dom} dom 节点
 */
function createDom(fiber){

    const dom = fiber.type === 'TEXT_ELEMENT' 
        ? document.createTextNode('')
        : document.createElement(fiber.type)

    updateDom(dom, {}, fiber.props)
    // Object.entries(fiber.props).forEach(prop => {
    //     if(prop[0] !== 'children') {
    //         dom[prop[0]] = prop[1]
    //     }
    // })

    return dom
}

const isEvent = key => key.startsWith('on')
const isProperty = key => key !== 'children' && !isEvent(key)
const isNew = (prev, next) => key => prev[key] !== next[key]
const isGone = (next) => key => !(key in next)
function updateDom (dom, prevProps, nextProps) {
    Object.keys(prevProps)
        .filter(isEvent)
        .filter(
            key => 
                isGone(nextProps)(key) ||
                isNew(prevProps, nextProps)(key)
        ).forEach(name => {
            const eventType = name.toLowerCase().substring(2)
            dom.removeEventListener(eventType, prevProps[name])
        })

    Object.keys(prevProps)
        .filter(isProperty)
        .filter(isGone(nextProps))
        .forEach(name => {dom[name] = ''})

    Object.keys(nextProps)
        .filter(isProperty)
        .filter(isNew(prevProps, nextProps))
        .forEach(name => {dom[name] = nextProps[name]})

    Object.keys(nextProps)
        .filter(isEvent)
        .filter(isNew(prevProps, nextProps))
        .forEach(name => {
            const eventType = name.toLowerCase().substring(2)
            dom.addEventListener(eventType, nextProps[name])
        })
}
let nextUnitOfWork = null
let wipRoot = null
let currentRoot = null
let deletions = null
function render (element, container) {
    wipRoot = {
        dom: container,
        props: {
            children: [element]
        },
        alternate: currentRoot
    }
    nextUnitOfWork = wipRoot
    deletions = []
}

function workLoop (deadline) {

    if(!nextUnitOfWork && wipRoot){
        commitRoot()
    }

    let shouldYield = false
    while (nextUnitOfWork && !shouldYield) {
        nextUnitOfWork = performUnitOfWork(nextUnitOfWork)
        console.log(nextUnitOfWork)
        shouldYield = deadline.timeRemaining() < 1
    }

    requestIdleCallback(workLoop)
}

requestIdleCallback(workLoop)

function reconcileChildren (wipFiber, elements) {
    let index = 0
    let prevSibling = null
    let oldFiber = wipFiber.alternate && wipFiber.alternate.child

    while (index < elements.length || oldFiber != null) {
        const element = elements[index]
        let newFiber = null
        const sameType = oldFiber && element && oldFiber.type == element.type

        if(sameType){
            newFiber = {
                type: element.type,
                props: element.props,
                parent: wipFiber,
                dom: oldFiber.dom,
                alternate: oldFiber,
                effectTag: 'UPDATE',
            }
        } else if (element && !sameType) {
            newFiber = {
                type: element.type,
                props: element.props,
                parent: wipFiber,
                dom: null,
                alternate: null,
                effectTag: 'PLACEMENT',
            }
        } else if (oldFiber && !sameType) {
            oldFiber.effectTag = 'DELETION'
            deletions.push(oldFiber)
        }
        

        if(index === 0){
            wipFiber.child = newFiber
        } else {
            prevSibling.sibling = newFiber
        }

        prevSibling = newFiber
        index++
    }
}

function updateHostComponent(fiber){
    if(!fiber.dom){
        fiber.dom = createDom(fiber)
    }
    reconcileChildren(fiber, fiber.props.children)
}

function updateFunctionComponent(fiber){
    const children = [fiber.type(fiber.props)]
    reconcileChildren(fiber, children)
}

function performUnitOfWork(fiber) {
    const isFunctionComponent = fiber && fiber.type && fiber.type instanceof Function
    if (isFunctionComponent) {
        updateFunctionComponent(fiber)
    } else {
        updateHostComponent(fiber)
    }

    // function component
    // if(!fiber.dom) {
    //     fiber.dom = createDom(fiber)
    // }

    // 防止渲染一半的UI
    // if(fiber.parent) {
    //     fiber.parent.dom.appendChild(fiber.dom)
    // }

    // const elements = fiber.props.children
    
    // reconcileChildren(fiber, elements)

    if(fiber.child){
        return fiber.child
    }
    let nextFiber = fiber
    while(nextFiber){
        if(nextFiber.sibling){
            return nextFiber.sibling
        }
        nextFiber = nextFiber.parent
    }
}

function commitRoot(){
    deletions.forEach(commitWork)
    commitWork(wipRoot.child)
    currentRoot = wipRoot
    wipRoot = null
}

function commitDeletion (fiber, domParent){
    if(fiber.dom){
        domParent.removeChild(fiber.dom)
    } else {
        commitDeletion(fiber.child, domParent)
    }
}

function commitWork(fiber){
    if(!fiber) return 

    let domParentFiber = fiber.parent
    while(!domParentFiber.dom){
        domParentFiber = domParentFiber.parent
    }

    const domParent = domParentFiber.dom
    if(fiber.effectTag === 'PLACEMENT' && fiber.dom != null){
        domParent.appendChild(fiber.dom)
    } else if (fiber.effectTag === 'DELETION') {
        commitDeletion(fiber, domParent)
    } else if (fiber.effectTag === 'UPDATE' && fiber.dom !== null){
        updateDom(fiber.dom, fiber.alternate.props, fiber.props)
    }

    commitWork(fiber.child)
    commitWork(fiber.sibling)
}
