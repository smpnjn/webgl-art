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

// Main function
void main() {
    // We have to adjust the effect to fit our resolution.
    // Heavily modified FBM function from https://thebookofshaders.com/13/
    vec2 res = (gl_FragCoord.xy + 100.) / (u_resolution.xy * u_scale);
    
    // Next lets get our colors
    vec3 highColor = rgb(u_highColor.r, u_highColor.g, u_highColor.b);
    vec3 lowColor = rgb(u_lowColor.r, u_lowColor.g, u_lowColor.b);
    
    // Set a random color
    vec3 color = vec3(23.0);

    // This is a randomised function based on fbm and some other variables
    // that we can adjust in our Javascript
    vec2 fbm1 = vec2(10.);
    fbm1.x = fbm( res + 0.05 * u_time) * snoise(res) * u_goCrazy;
    fbm1.y = fbm( res + vec2(3.0)) / (u_manipulate - snoise(res)) * 9. * u_goCrazy / u_veinDefinition * u_clickLength * 5.;

    // Next we adjust it all based on mouse position, time, and qfbm1
    vec2 r = vec2(0.);
    r.x = fbm( res + fbm1 * u_time * 0.1 ) + -sin(u_mouse.x) + 600.;
    r.y = fbm( res + fbm1 * u_time * 0.5 ) * -u_mouse.y;

    // And create a float of fbm, for use in the final color
    float f = fbm(res+r) * 1.;

    // Then we mix all our colors together
    color = mix(highColor*2., lowColor, f*3.);
    color = mix(color, lowColor, clamp(length(fbm1),0.0,2.0)); // * snoise(st) * 51.9
    color = mix(color, highColor, clamp(length(r.y),0.0,3.0));

    // And output them for render
    gl_FragColor = vec4((f*f*f*0.9*f*f+.5*f)*color,1.);
}
