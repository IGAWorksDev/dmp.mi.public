import React from "react";
import "./SampleChart.scss";
import {observer} from "mobx-react";
import {action, makeObservable, observable} from "mobx";

interface SampleChartProps {
    series: any;
    categories:any;
    otherHandler: ()=>void;
}

@observer
export default class SampleChart extends React.Component<SampleChartProps> {
    private readonly ref = React.createRef<HTMLDivElement>();
    @observable
    private max:number = 0;
    @observable
    private gridUnit:number[] = [];
    @observable
    private pointList:any = [];
    @observable
    private hoverIdx:number = -1;
    @observable
    private pointerPosition:any = {};

    constructor(props:any) {
        super(props);
        makeObservable(this);
    }

    componentDidMount() {
        this.setData();
        window.addEventListener('resize', this.setData);
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.setData);
    }

    componentDidUpdate(prevProps: Readonly<SampleChartProps>, prevState: Readonly<{}>, snapshot?: any) {
        extLineAnimation("line-path");
    }

    @action
    private setHoverIdx = (idx:number) => {
        this.hoverIdx = idx;
    }

    @action
    private setData = () => {
        const {series} = this.props;
        if(series){
            const numList = Object.keys(series).reduce((rs:any, a:any, i:number) => {
                rs.push(...series[a].reduce((rs2:any, b:any, j:number) => {
                    rs2.push(b);
                    return rs2;
                }, []));
                return rs;
            }, []);
            const maxData = Math.max(...numList);
            const maxLength = Math.floor(Math.log10(maxData)) || 1;
            const maxRange = Math.pow(10, maxLength);
            const max = Math.floor((maxRange + maxData) / maxRange) * maxRange;
            this.max = max;
            //todo: grid 갯수를 구하는 logic
            this.gridUnit = Array.from({length:4}, (a, i) => {
                return max / 4 * (i + 1);
            });
            setTimeout(()=>{this.setPointList()}, 300);
        }
    }

    @action
    private setPointList = () => {
        const {series, categories} = this.props;
        if(this.ref.current) {
            const {width, height} = this.ref.current.getBoundingClientRect();
            const stackXPoint = width / categories.length;
            this.pointList = Object.keys(series).reduce((rs:any, a, i) => {
                rs.push(
                    series[a].reduce((rs2:any, b:any, j:number) => {
                        const perData = b / this.max * 100;
                        const yPoint = height - (height * perData / 100);
                        const xPoint = (stackXPoint * (j + 1)) - (stackXPoint/2);
                        rs2.push({
                            x:xPoint,
                            y:yPoint,
                        })
                        return rs2;
                    }, [])
                );
                return rs;
            }, []);
        }
    }

    private renderYAxis = () => {
        return <span className={"data-unit-grid"}>
            {[...this.gridUnit].reverse().map((v, j) =>
                <span className={"grid-box"} key={`grid-blank-${j}`}>
                    <span>{v}</span>
                </span>)}
            <span className={"grid-box-zero"}>0</span>
        </span>
    }

    private renderXAxis = () => {
        const {categories} = this.props;
        return <span className={"cate-grid"}>
            {categories?.map((v:any, j:number) =>
                <span className={"grid-box"} key={`grid-blank-${j}`}>
                    <span>{v}</span>
                </span>)}
        </span>
    }

    private renderXAxisCover = () => {
        const {categories} = this.props;
        return <span className={"cate-grid-cover"}>
            {categories?.map((v:any, j:number) =>
                <span className={"grid-box"} key={`grid-blank-${j}`}
                      onMouseOver={()=>this.setHoverIdx(j)} onMouseLeave={()=>this.setHoverIdx(-1)}>
                    {j === this.hoverIdx && this.renderTooltip(this.hoverIdx)}
                </span>)}
        </span>
    }

    private renderTooltip = (idx:number) => {
        if(idx === -1) return;
        const {series} = this.props;
        const tooltip = Object.keys(series).reduce((rs:any, a, i) => {
            rs[a] = series[a][idx];
            return rs;
        }, {});
        return <div className={'tooltip'} style={{...this.pointerPosition}}>
            {
                Object.keys(tooltip).map((a, i) => {
                    return <span key={`tooltip-${i}`} className={'data'}>
                        <span/>
                        <span>{a}</span>
                        <span>{tooltip[a]}</span>
                    </span>
                })
            }
        </div>
    }

    private renderPoint = () => {
        return <span className={'point-grid'}>
            {this.pointList.map((point:any, i:number)=> {
                return <span className={'gird-box'} key={`point-grid-box-${i}`}>
                    {
                        point.map((a:any, j:number) => {
                            return <span className={'point'}
                                         key={`point-${i}-${j}`}
                                         style={{
                                             position:"absolute",
                                             top:`${a.y}px`,
                                             left:`${a.x}px`
                                         }}
                            />
                        })
                    }
                </span>
            })}
        </span>
    }

    private renderLine = () => {
        if(this.ref.current) {
            const {width, height} = this.ref.current.getBoundingClientRect();
            return <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={'line-grid'}>
                {
                    this.pointList.map((path:any, i:number) => {
                        const pathArr = path.map((p:any, z:number) => z === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`);
                        const d = pathArr.join(' ');
                        return <path className={'line-path'} key={`line-path-${i}`} d={d} />
                    })
                }
            </svg>
        } else {
            return <></>
        }
    }

    render() {
        const {series} = this.props;
        return <article className={"line-chart"}>
            <div className={'chart-info'}>
                <span className={'title'}>Chart-Title</span>
                <div className={'legend'}>
                    {Object.keys(series).map((a, i:number)=> <span key={`dot-${i}`}>
                        <span className={'dot'}/>
                        <span>{a}</span>
                    </span>)}
                </div>
            </div>
            <div className={"chart"} ref={this.ref}>
                <span className={'y-title'}>
                    <span>Y-Title(unit)</span>
                </span>
                {this.renderYAxis()}
                {this.renderXAxis()}
                {/*{this.renderPoint()}*/}
                {this.renderLine()}
                <span className={'x-title'}>X-Title </span>
                {this.renderXAxisCover()}
            </div>
        </article>
    }
}

function extLineAnimation(className:string) {
    const allLines = document.getElementsByClassName(className);
    if (allLines.length > 0) {
        for (let eachLine of allLines as any) {
            if (!(eachLine instanceof SVGPathElement)) {
                continue;
            }
            if (eachLine?.getTotalLength !== undefined) {
                const lineLength = String(eachLine.getTotalLength());
                eachLine.setAttribute('stroke-dasharray', lineLength);
                eachLine.setAttribute('stroke-dashoffset', lineLength);
            }
        }
    }
}
