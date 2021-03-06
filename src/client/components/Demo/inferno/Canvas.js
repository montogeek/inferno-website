import Inferno from 'inferno'
import Component from 'inferno-component'
import perfMonitor from '../system/perfMonitor'
import Emitter from '../system/Emitter'
import Particle from '../system/Particle'
import { Field, remove } from '../system/utils'
import { ParticleComponent, FieldComponent } from './Elements'

const pool = []
const particles = []
const field = new Field([0, 0], -30)

export default class Canvas extends Component {
    constructor() {
        super()
        this.state = {
            mouse: [0, 0]
        }
    }
    componentDidMount() {
        this.loop()
        const canvas = document.getElementById('demo-canvas')
        canvas.addEventListener('mousemove', this.onMouseMove)
        perfMonitor.startFPSMonitor()
        perfMonitor.startMemMonitor()
        perfMonitor.initProfiler('flame update')
        console.log(this.props)
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.paused !== this.props.paused) {
            window.requestAnimationFrame(this.loop)
        }
    }

    onMouseMove = (e) => {
        field.position[0] = e.offsetX
        field.position[1] = e.offsetY

        this.setState({
            mouse: [e.offsetX, e.offsetY]
        })
    }

    update = () => {
        const { lifetime, emissionRate } = this.props

        // Emit particles
        for (let j = 0; j < emissionRate; j++) {
            particles.push(
                Emitter.emit(lifetime)
            )
        }

        // Update velocities
        for (let i in particles) {
            let p = particles[i]
            Particle.submitToFields(p, field);
            Particle.update(p)
        }

        // recycle
        for (let i in particles) {
            let p = particles[i]
            p.lifetime += 1

            // If we're out of bounds, drop this particle and move on to the next
            if (p.lifetime > p.lifetimeMax) {
                remove(particles, p)
                continue
            }
        }

        window.requestAnimationFrame(this.loop)
    }

    loop = () => {
        if (!this.props.paused) {
            perfMonitor.startProfile('flame update');
            this.update();
            this.forceUpdate()
            perfMonitor.endProfile('flame update');
        }
    }

    render() {
        return <div>
            <ParticleCounter count={particles.length}/>
            <div id="demo-canvas" style={window.demo}>
                {particles.map(data => <ParticleComponent {...data}/>)}
                <FieldComponent {...field}/>
            </div>
        </div>
    }
}

class ParticleCounter extends Component {
    shouldComponentUpdate(nextProps) {
        if (this.props.count !== nextProps.count) {
            return true
        }
        return false
    }
    render() {
        return <div className="demo-counter">
            Particles ({this.props.count})
        </div>
    }
}
