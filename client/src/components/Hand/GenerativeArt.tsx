import { useAuth0 } from "@auth0/auth0-react";
import React, { useEffect, useRef, useContext } from 'react';
import axios from 'axios';
import { Socket } from 'socket.io-client';
import { SocketContext } from './Sculpture';
import p5 from 'p5';
import styled from 'styled-components';
import { FaSave } from 'react-icons/fa';

const SaveButton = styled.div`
  position: absolute;
  left: -78px;
  bottom: 4px;
  z-index: 2;
  cursor: pointer;

  &:hover {
    color: #8b88b5;
  }
`

const GenerativeArt = ({ roomId }) => {
  const { user, isAuthenticated, isLoading } = useAuth0();
  const canvasRef = useRef(null);
  const socket = useContext(SocketContext) as Socket;
  useEffect(() => {
    // Create p5 sketch
    const sketch = (p: any) => {
      let paths = [];
      let painting = false;
      let next = 0;
      let current;
      let previous;

      p.setup = () => {
        const container = document.querySelector('.canvas-container');
        const canvasWidth = container?.clientWidth - 7;
        const canvasHeight = container?.clientHeight - 7;
        p.createCanvas(canvasWidth, canvasHeight, p.WEBGL).parent(canvasRef.current);
        p.background(61, 57, 131); // Set background color to #3d3983
        current = p.createVector(0, 0, 0);
        previous = p.createVector(0, 0, 0);
        socket.on('drawing', data => {
          if (p.canvas) {
            if (data.painting) {
              current.x = data.x - p.width / 2
              current.y = data.y - p.height / 2
              let force = p5.Vector.sub(current, previous);
              force.mult(0.05);

              paths.at(-1).add(current, force);

              next = p.millis() + p.random(100);

              previous.x = current.x;
              previous.y = current.y;
            }
          }
        });
      };

      p.draw = () => {
        p.background(61, 57, 131); // Set background color to #3d3983
        if (p.millis() > next && painting) {
          current.x = p.mouseX - p.width / 2;
          current.y = p.mouseY - p.height / 2;

          let force = p5.Vector.sub(current, previous);
          force.mult(0.05);

          paths[paths.length - 1].add(current, force);

          next = p.millis() + p.random(100);

          previous.x = current.x;
          previous.y = current.y;

          socket.emit('drawing', {
            x: p.mouseX,
            y: p.mouseY,
            painting,
            roomId
          })
        }

        for (let i = 0; i < paths.length; i++) {
          paths[i].update();
          paths[i].display();
        }
      };

      p.mousePressed = () => {
        next = 0;
        painting = true;
        previous.x = p.mouseX - p.width / 2;
        previous.y = p.mouseY - p.height / 2;
        paths.push(new Path());
      };

      p.mouseReleased = () => {
        painting = false;
      };

      class Path {
        constructor() {
          this.particles = [];
          this.hue = p.random(100);
        }

        add(position, force) {
          this.particles.push(new Particle(position, force, this.hue));
        }

        update() {
          for (let i = 0; i < this.particles.length; i++) {
            this.particles[i].update();
          }
        }

        display() {
          for (let i = this.particles.length - 1; i >= 0; i--) {
            if (this.particles[i].lifespan <= 0) {
              this.particles.splice(i, 1);
            } else {
              this.particles[i].display(this.particles[i + 1]);
            }
          }
        }
      }

      class Particle {
        constructor(position, force, hue) {
          this.position = p.createVector(position.x, position.y, position.z);
          this.velocity = p.createVector(force.x, force.y, force.z);
          this.drag = 0.95;
          this.lifespan = 255;
        }

        update() {
          this.position.add(this.velocity);
          this.velocity.mult(this.drag);
          this.lifespan--;
        }

        display(other) {
          p.stroke(240, 107, 128, this.lifespan); // Set art color to #f06b80
          p.fill(240, 107, 128, this.lifespan / 2);

          p.push();
          p.translate(this.position.x, this.position.y, this.position.z);
          p.sphere(8);
          p.pop();

          if (other) {
            p.line(
              this.position.x,
              this.position.y,
              other.position.x,
              other.position.y,
            );
          }
        }
      }
    };
    // Create new p5 instance
    new p5(sketch);

    return () => {
      socket.disconnect();
    }

  }, [roomId]);

  const handleSave = async () => {
    const canvas = canvasRef.current.querySelector('canvas');
    try {
      if (canvas && user) {
        await axios.post('/sculpture', { canvas: canvas.toDataURL(), userId: user?.sub });
      }
    } catch (err) {
      console.error('Unable to POST artwork to DB at client', err);
    }
  };

  return (
    <div className='canvas-container' style={{ position: 'relative' }}>
      <div ref={canvasRef} style={{ position: 'relative', zIndex: '1' }}>
        {user &&
          <SaveButton
            onClick={handleSave}
          >
            <FaSave size={48} />
          </SaveButton>
        }
      </div>
    </div>
  );
};

export default GenerativeArt;
