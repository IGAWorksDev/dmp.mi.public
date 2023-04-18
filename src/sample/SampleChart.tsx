import React from "react";
import "./SampleChart.scss";
import {observer} from "mobx-react";
import {action, computed, makeObservable, observable} from "mobx";

interface SeriesProps {
    [key:string]: number[];
}

interface SampleChartProps {
    title:string;
    series: SeriesProps;
    categories: string[];
    handleOtherEvent?: (idx:number) => void;
}

@observer
export default class SampleChart extends React.Component<SampleChartProps> {
    private readonly ref = React.createRef<HTMLDivElement>();
    private readonly refLineGrid = React.createRef<SVGSVGElement>();
    @observable
    private width: number = 0;
    @observable
    private height: number = 0;
    @observable
    private hoverIdx: number = -1;
    @observable
    private pointerPosition: any = {};

    constructor(props: any) {
        super(props);
        makeObservable(this);
    }

    componentDidMount() {
        this.updateScreenSize();
        window.addEventListener('resize', this.updateScreenSize);
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.updateScreenSize);
    }

    componentDidUpdate(prevProps: Readonly<SampleChartProps>, prevState: Readonly<{}>, snapshot?: any) {
        this.runAnimation();
    }

    @action
    private updateScreenSize = () => {
        const {width = 0, height = 0} = this.ref.current?.getBoundingClientRect() ?? {};
        this.width = width;
        this.height = height;
    }

    @computed
    private get max(): number {
        const {series = {}} = this.props;
        const numList = Object.keys(series).reduce((rs: any, a: any, i: number) => {
            rs.push(...series[a].reduce((rs2: any, b: any, j: number) => {
                rs2.push(b);
                return rs2;
            }, []));
            return rs;
        }, []);
        const maxData = Math.max(...numList);
        const maxLength = Math.floor(Math.log10(maxData)) || 1;
        const maxRange = Math.pow(10, maxLength);
        return Math.floor((maxRange + maxData) / maxRange) * maxRange;
    }

    @computed
    private get gridUnit(): number[] {
        return Array.from({length: 4}, (a, i) => this.max / 4 * (i + 1));
    }

    @computed
    private get pointList() {
        const {series, categories} = this.props;
        const {width, height} = this;
        const stackXPoint = width / categories.length;
        return Object.keys(series).reduce((rs: any, a, i) => {
            rs.push(
                series[a].reduce((rs2: any, b: any, j: number) => {
                    const perData = b / this.max * 100;
                    const yPoint = height - (height * perData / 100);
                    const xPoint = (stackXPoint * (j + 1)) - (stackXPoint / 2);
                    rs2.push({
                        x: xPoint,
                        y: yPoint,
                    })
                    return rs2;
                }, [])
            );
            return rs;
        }, []);
    }

    @action
    private setHoverIdx = (idx: number) => action(() => {
        this.hoverIdx = idx;
        this.props.handleOtherEvent && this.props.handleOtherEvent(idx);
    });


    private renderYAxis = () => {
        return <div className={"data-unit-grid"}>
            {[...this.gridUnit].reverse().map((v, j) =>
                <p className={"grid-box"} key={`grid-blank-${j}`}>
                    <span>{v}</span>
                </p>)}
            <p className={"grid-box-zero"}>0</p>
        </div>
    }

    private renderXAxis = () => {
        const {categories} = this.props;
        return <div className={"cate-grid"}>
            {categories?.map((v: any, j: number) =>
                <p className={"grid-box"} key={`grid-blank-${j}`}>
                    <span>{v}</span>
                </p>)}
        </div>
    }

    private renderXAxisCover = () => {
        const {categories} = this.props;
        return <div className={"cate-grid-cover"}>
            {categories?.map((v: any, j: number) =>
                <p className={"grid-box"} key={`grid-blank-${j}`}
                      onMouseOver={this.setHoverIdx(j)} onMouseLeave={this.setHoverIdx(-1)}>
                    {j === this.hoverIdx && this.renderTooltip(this.hoverIdx)}
                </p>)}
        </div>
    }

    private renderTooltip = (idx: number) => {
        if (idx === -1) return;
        const {series} = this.props;
        const tooltip = Object.keys(series).reduce((rs: any, a, i) => {
            rs[a] = series[a][idx];
            return rs;
        }, {});
        return <span className={'tooltip'} style={{...this.pointerPosition}}>
            {
                Object.keys(tooltip).map((a, i) => {
                    return <span key={`tooltip-${i}`} className={'data'}>
                        <span/>
                        <span>{a}</span>
                        <span>{tooltip[a]}</span>
                    </span>
                })
            }
        </span>
    }

    private renderPoint = () => {
        return <div className={'point-grid'}>
            {this.pointList.map((point: any, i: number) => {
                return <p className={'gird-box'} key={`point-grid-box-${i}`}>
                    {
                        point.map((a: any, j: number) => {
                            return <span className={'point'}
                                         key={`point-${i}-${j}`}
                                         style={{
                                             position: "absolute",
                                             top: `${a.y}px`,
                                             left: `${a.x}px`
                                         }}
                            />
                        })
                    }
                </p>
            })}
        </div>
    }

    private renderLine = () => {
        const {width, height} = this;
        return <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={'line-grid'} ref={this.refLineGrid}>
            {
                this.pointList.map((path: any, i: number) => {
                    const pathArr = path.map((p: any, z: number) => z === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`);
                    const d = pathArr.join(' ');
                    return <path className={'line-path'} key={`line-path-${i}`} d={d}/>
                })
            }
        </svg>
    }

    private runAnimation = () => {
        const {children = []} = this.refLineGrid.current ?? {};
        if (children.length > 0) {
            for (let eachLine of children as any) {
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

    render() {
        const {title, series} = this.props;
        return <article className={"line-chart"}>
            <header>
                <h3 className={'title'}>{title}</h3>
                <div className={'legend'}>
                    {Object.keys(series).map((a, i: number) => <p key={`dot-${i}`}>
                        <span className={'dot'}/>{a}
                    </p>)}
                </div>
            </header>
            <div className={"chart"} ref={this.ref}>
                <p className={'y-title'}>
                    <span>Y-Title(unit)</span>
                </p>
                {this.renderYAxis()}
                {this.renderXAxis()}
                {/*{this.renderPoint()}*/}
                {this.renderLine()}
                <p className={'x-title'}>X-Title </p>
                {this.renderXAxisCover()}
            </div>
        </article>
    }
}
