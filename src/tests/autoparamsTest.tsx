import { NaiveAsync } from "../naiveasync";

const op = (params : {}) => Promise.resolve(`✅ with params ${JSON.stringify(params)}`)

const autoParamsTest: React.FC = () => (<NaiveAsync operation={op} autoParams={{}} >{(state) => (<div>
    <span>state: {}</span>
    <span>params: {}</span>
    <span>error: {}</span>
    <span>data: {}</span>
</div>)}

</NaiveAsync>)

export default autoParamsTest