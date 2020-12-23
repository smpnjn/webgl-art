vec3 rgb(float r, float g, float b) {
    return vec3(r / 255., g / 255., b / 255.);
}
vec3 rgb(float c) {
    return vec3(c / 255., c / 255., c / 255.);
}

uniform vec3 u_lowColor;
uniform vec3 u_highColor;
uniform float u_time;
uniform float u_goCrazy;
uniform float u_veinDefinition;
uniform float u_manipulate;
uniform float u_clickLength;
uniform vec2 u_resolution;
uniform float u_scale;
uniform vec2 u_mouse;
uniform sampler2D u_inputTexture;

varying vec2 vUv;
varying float vDistortion;
varying float xDistortion;


void main() {
    vec2 st = (gl_FragCoord.xy + 100.) / (u_resolution.xy * u_scale);
    vec3 highColor = rgb(u_highColor.r, u_highColor.g, u_highColor.b);
    vec3 lowColor = rgb(u_lowColor.r, u_lowColor.g, u_lowColor.b);
    vec4 texture = texture2D(u_inputTexture, vUv);
    vec3 color = vec3(23.0);

    vec2 q = vec2(10.);
    q.x = fbm( st + 0.05 * u_time) * snoise(st) * u_goCrazy;
    q.y = fbm( st + vec2(3.0)) / (u_manipulate - snoise(st)) * 9. * u_goCrazy / u_veinDefinition * u_clickLength * 5.;

    vec2 r = vec2(0.);
    r.x = fbm( st + 1.0*q * u_time * 0.1 ) + -sin(u_mouse.x) + 600.;
    r.y = fbm( st + 1.0*q * u_time * 0.5 ) * -u_mouse.y;

    float f = fbm(st+r) * 1.;

    color = mix(highColor*2., lowColor, f*3.);
    color = mix(color, lowColor, clamp(length(q),0.0,2.0)); // * snoise(st) * 51.9
    color = mix(color, highColor, clamp(length(r.y),0.0,3.0));


    gl_FragColor = vec4((f*f*f*0.9*f*f+.5*f)*color,1.);
}
