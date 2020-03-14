const shaders = [``, ``, ``, ``, ``, ``, ``, ``, ``, ``, ``, ``, ``];

shaders[0] = `
uniform float u_time;
uniform vec2 u_resolution;

#define PI 3.14159265358

vec2 paramFunction(float theta, float phaseOffset) {
    float x = sin(4.0 * theta + phaseOffset);
    float y = sin(5.0 * theta);
    return vec2(x, y);
}

float circleMask(vec2 centre, float r, float blurRadius, vec2 st) {
    vec2 difference = st - centre;
    float distance2 = dot(difference, difference);
    float solid2 = pow(r, 2.0);
    float blur2 = pow(r + blurRadius, 2.0);
    return 1.0 - smoothstep(solid2, blur2, distance2);
}

void main() {
    vec2 st = gl_FragCoord.xy / u_resolution.xy * 2.0 - vec2(1.0, 1.0);
    float aspectRatio = u_resolution.x / u_resolution.y;
    float r = step(1.0, aspectRatio);
    st.x = st.x * mix(1.0, aspectRatio, r);
    st.y = st.y / mix(aspectRatio, 1.0, r);
    vec3 colour = vec3(0.0, 0.0, 0.0);
    
    vec3 skyColour = vec3(0.0, 0.0, 0.3);
    vec3 groundColour = vec3(0.0, 0.0, 0.5);
    vec3 fireflyColour = vec3(1.0, 1.0, 0.0);
    vec3 glowColour = vec3(1.0, 1.0, 1.0);
    colour = mix(groundColour, skyColour, st.y);
    
    float lightMask = 0.0;
    float glowMask = 0.0;
    for(int i = 0; i < 50; i ++ ) {
        float phase = PI / 25.0 * float(i) + u_time * 0.01;
        vec2 location = paramFunction(phase, 0.0);
        lightMask = lightMask + circleMask(location, 0.01, 0.02, st);
        glowMask = glowMask + circleMask(location, 0.01, 0.0, st);
    }
    lightMask = clamp(lightMask, 0.0, 1.0);
    glowMask = clamp(glowMask, 0.0, 1.0);
    colour = mix(colour, fireflyColour, lightMask);
    colour = mix(colour, glowColour, glowMask);
    
    gl_FragColor = vec4(colour, 1.0);
}
`;

shaders[1] = `
uniform float u_time;
uniform vec2 u_resolution;

float function(float x) {
    float y = 0.7 * sin(10.0 * (x + u_time * 0.05));
    return y;
}

float derivative(float x) {
    float dydx = 0.7 * 10.0 * cos(10.0 * (x + u_time * 0.05));
    return dydx;
}

float functionMask(float thickness, float blurRadius, vec2 st) {
    float y = function(st.x);
    vec2 target = vec2(st.x, y);
    float dydx = derivative(st.x);
    float angle = atan(dydx);
    vec2 normal = vec2(-sin(angle), cos(angle));
    float thicknessBy2 = thickness / 2.0;
    float distanceToWave = dot(st - target, normal);
    return smoothstep(-blurRadius - thicknessBy2, - thicknessBy2, distanceToWave) -
    smoothstep(thicknessBy2, blurRadius + thicknessBy2, distanceToWave);
}

float lineMask(vec2 start, vec2 end, float thickness, float blurRadius, vec2 st) {
    float lengthOfLine = length(end - start);
    vec2 tangentUnit = (end - start) / lengthOfLine;
    vec2 normalUnit = vec2(-tangentUnit.y, tangentUnit.x);
    float tangentLength = dot(st - start, tangentUnit);
    float normalLength = dot(st - start, normalUnit);
    float thicknessBy2 = thickness / 2.0;
    float tangentMask = smoothstep(-blurRadius, 0.0, tangentLength) -
    smoothstep(lengthOfLine, lengthOfLine + blurRadius, tangentLength);
    float normalMask = smoothstep(-thicknessBy2 - blurRadius, - thicknessBy2, normalLength) -
    smoothstep(thicknessBy2, thicknessBy2 + blurRadius, normalLength);
    return tangentMask * normalMask;
}

float circleOutlineMask(vec2 centre, float r, float thickness, float blurRadius, vec2 st) {
    vec2 diff = st - centre;
    float length2 = dot(diff, diff);
    float solidLeft2 = pow(r - thickness / 2.0, 2.0);
    float solidRight2 = pow(r + thickness / 2.0, 2.0);
    float blurLeft2 = pow(r - thickness / 2.0 - blurRadius, 2.0);
    float blurRight2 = pow(r + thickness / 2.0 + blurRadius, 2.0);
    return smoothstep(blurLeft2, solidLeft2, length2) - smoothstep(solidRight2, blurRight2, length2);
}

float circleMask(vec2 centre, float r, float blurRadius, vec2 st) {
    vec2 difference = st - centre;
    float distance2 = dot(difference, difference);
    float solid2 = pow(r, 2.0);
    float blur2 = pow(r + blurRadius, 2.0);
    return 1.0 - smoothstep(solid2, blur2, distance2);
}

void main() {
    vec2 st = gl_FragCoord.xy / u_resolution.xy * 2.0 - vec2(1.0, 1.0);
    float aspectRatio = u_resolution.x / u_resolution.y;
    // st.x = st.x * aspectRatio;
    float r = step(1.0, aspectRatio);
    st.x = st.x * mix(1.0, aspectRatio, r);
    st.y = st.y / mix(aspectRatio, 1.0, r);
    vec2 rst = vec2(-st.y, st.x);
    st = mix(rst, st, r);
    vec3 colour = vec3(0.0, 0.0, 0.0);
    
    vec3 light = vec3(0.0, 0.5, 0.0);
    vec3 glow = vec3(1.0, 1.0, 1.0);
    
    float radius = 0.7;
    float cyAxisLoc = 0.9;
    vec2 circleCentre = vec2(cyAxisLoc, 0.0);
    vec2 pointLoc = vec2(radius * cos(u_time * 0.5) + circleCentre.x, radius * sin(u_time * 0.5));
    vec2 pointOnSinLoc = vec2(0.0, radius * sin(u_time * 0.5));
    
    float xAxisMask = lineMask(vec2(-10.0, 0.0), vec2(10.0, 0.0), 0.005, 0.005, st);
    float cyAxisMask = lineMask(vec2(cyAxisLoc, 0.9), vec2(cyAxisLoc, - 0.9), 0.005, 0.005, st);
    float yAxisMask = lineMask(vec2(0.0, 0.9), vec2(0.0, - 0.9), 0.005, 0.005, st);
    
    float circle = circleOutlineMask(circleCentre, radius, 0.02, 0.02, st);
    float circleGlow = circleOutlineMask(circleCentre, radius, 0.02, 0.0, st);
    float point = circleMask(pointLoc, 0.03, 0.03, st);
    float pointGlow = circleMask(pointLoc, 0.03, 0.0, st);
    float sinWave = functionMask(0.02, 0.02, st);
    float sinWaveGlow = functionMask(0.02, 0.0, st);
    float pointOnSin = circleMask(pointOnSinLoc, 0.03, 0.03, st);
    float pointOnSinGlow = circleMask(pointOnSinLoc, 0.03, 0.0, st);
    float indicator = lineMask(pointLoc, pointOnSinLoc, 0.01, 0.01, st);
    float indicatorGlow = lineMask(pointLoc, pointOnSinLoc, 0.01, 0.0, st);
    float angleIndicator = lineMask(pointLoc, circleCentre, 0.01, 0.01, st);
    float angleIndicatorGlow = lineMask(pointLoc, circleCentre, 0.01, 0.0, st);
    
    sinWave = sinWave * (1.0 - step(0.0, st.x));
    sinWaveGlow = sinWaveGlow * (1.0 - step(0.0, st.x));
    colour = mix(colour, light, xAxisMask + cyAxisMask + yAxisMask);
    colour = mix(colour, light, circle + sinWave);
    colour = mix(colour, glow, circleGlow + sinWaveGlow);
    colour = mix(colour, light, indicator + angleIndicator);
    colour = mix(colour, glow, indicatorGlow + angleIndicatorGlow);
    colour = mix(colour, light, point + pointOnSin);
    colour = mix(colour, glow, pointGlow + pointOnSinGlow);
    gl_FragColor = vec4(colour, 1.0);
}`;

shaders[2] = `uniform float u_time;
uniform vec2 u_resolution;

float function(float x) {
    float y = sin(5.0 * x);
    return y;
}

float derivative(float x) {
    float dydx = 5.0 * cos(5.0 * x);
    return dydx;
}

float functionMask(float thickness, float blurRadius, vec2 st) {
    float y = function(st.x);
    vec2 target = vec2(st.x, y);
    float dydx = derivative(st.x);
    float angle = atan(dydx);
    vec2 normal = vec2(-sin(angle), cos(angle));
    float thicknessBy2 = thickness / 2.0;
    float distanceToWave = dot(st - target, normal);
    return smoothstep(-blurRadius - thicknessBy2, - thicknessBy2, distanceToWave) -
    smoothstep(thicknessBy2, blurRadius + thicknessBy2, distanceToWave);
}

float lineMask(vec2 start, vec2 end, float thickness, float blurRadius, vec2 st) {
    float lengthOfLine = length(end - start);
    vec2 tangentUnit = (end - start) / lengthOfLine;
    vec2 normalUnit = vec2(-tangentUnit.y, tangentUnit.x);
    float tangentLength = dot(st - start, tangentUnit);
    float normalLength = dot(st - start, normalUnit);
    float thicknessBy2 = thickness / 2.0;
    float tangentMask = smoothstep(-blurRadius, 0.0, tangentLength) -
    smoothstep(lengthOfLine, lengthOfLine + blurRadius, tangentLength);
    float normalMask = smoothstep(-thicknessBy2 - blurRadius, - thicknessBy2, normalLength) -
    smoothstep(thicknessBy2, thicknessBy2 + blurRadius, normalLength);
    return tangentMask * normalMask;
}

void main() {
    vec2 st = gl_FragCoord.xy / u_resolution.xy * 2.0 - vec2(1.0, 1.0);
    float aspectRatio = u_resolution.x / u_resolution.y;
    float r = step(1.0, aspectRatio);
    st.x = st.x * mix(1.0, aspectRatio, r) * 1.5;
    st.y = st.y / mix(aspectRatio, 1.0, r) * 1.5;
    vec3 colour = vec3(0.0, 0.0, 0.0);
    
    vec3 light = vec3(0.0, 0.5, 0.0);
    vec3 glow = vec3(1.0, 1.0, 1.0);
    
    float xAxisLight = lineMask(vec2(-10.0, 0.0), vec2(10.0, 0.0), 0.005, 0.01, st);
    float yAxisLight = lineMask(vec2(0.0, - 10.0), vec2(0.0, 10.0), 0.005, 0.01, st);
    float signalLight = functionMask(0.05, 0.05, vec2(st.x + u_time * 0.5, st.y));
    float signalGlow = functionMask(0.05, 0.0, vec2(st.x + u_time * 0.5, st.y));
    
    colour = mix(colour, light, xAxisLight);
    colour = mix(colour, light, yAxisLight);
    colour = mix(colour, light, signalLight);
    colour = mix(colour, glow, signalGlow);
    gl_FragColor = vec4(colour, 1.0);
}`;

shaders[3] = `uniform float u_time;
uniform vec2 u_resolution;
uniform float a;
uniform float w;

float function(float x) {
    float y = (0.5 + a * sin(w * x)) * sin(10.0 * x);
    return y;
}

float derivative(float x) {
    float dydx = 0.5 * 10.0 * cos(10.0 * x) + a * (w * cos(w * x) * sin(10.0 * x) + 10.0 * sin(w * x) * cos(10.0 * x));
    return dydx;
}

float functionMask(float thickness, float blurRadius, vec2 st) {
    float y = function(st.x);
    vec2 target = vec2(st.x, y);
    float dydx = derivative(st.x);
    float angle = atan(dydx);
    vec2 normal = vec2(-sin(angle), cos(angle));
    float thicknessBy2 = thickness / 2.0;
    float distanceToWave = dot(st - target, normal);
    return smoothstep(-blurRadius - thicknessBy2, - thicknessBy2, distanceToWave) -
    smoothstep(thicknessBy2, blurRadius + thicknessBy2, distanceToWave);
}

float lineMask(vec2 start, vec2 end, float thickness, float blurRadius, vec2 st) {
    float lengthOfLine = length(end - start);
    vec2 tangentUnit = (end - start) / lengthOfLine;
    vec2 normalUnit = vec2(-tangentUnit.y, tangentUnit.x);
    float tangentLength = dot(st - start, tangentUnit);
    float normalLength = dot(st - start, normalUnit);
    float thicknessBy2 = thickness / 2.0;
    float tangentMask = smoothstep(-blurRadius, 0.0, tangentLength) -
    smoothstep(lengthOfLine, lengthOfLine + blurRadius, tangentLength);
    float normalMask = smoothstep(-thicknessBy2 - blurRadius, - thicknessBy2, normalLength) -
    smoothstep(thicknessBy2, thicknessBy2 + blurRadius, normalLength);
    return tangentMask * normalMask;
}

void main() {
    vec2 st = gl_FragCoord.xy / u_resolution.xy * 2.0 - vec2(1.0, 1.0);
    float aspectRatio = u_resolution.x / u_resolution.y;
    float r = step(1.0, aspectRatio);
    st.x = st.x * mix(1.0, aspectRatio, r) * 1.5;
    st.y = st.y / mix(aspectRatio, 1.0, r) * 1.5;
    vec3 colour = vec3(0.0, 0.0, 0.0);
    
    vec3 light = vec3(0.0, 0.5, 0.0);
    vec3 glow = vec3(1.0, 1.0, 1.0);
    
    float xAxisLight = lineMask(vec2(-10.0, 0.0), vec2(10.0, 0.0), 0.005, 0.01, st);
    float yAxisLight = lineMask(vec2(0.0, - 10.0), vec2(0.0, 10.0), 0.005, 0.01, st);
    float signalLight = functionMask(0.05, 0.05, vec2(st.x + u_time * 0.5, st.y));
    float signalGlow = functionMask(0.05, 0.0, vec2(st.x + u_time * 0.5, st.y));
    
    colour = mix(colour, light, xAxisLight);
    colour = mix(colour, light, yAxisLight);
    colour = mix(colour, light, signalLight);
    colour = mix(colour, glow, signalGlow);
    gl_FragColor = vec4(colour, 1.0);
}`;

shaders[4] = `uniform float u_time;
uniform vec2 u_resolution;
uniform float a;
uniform float w;

float function(float x) {
    // Modulating: 2sin(x)
    float y = sin(10.0 * x - a / w * cos(w * x));
    return y;
}

float derivative(float x) {
    float dydx = cos(10.0 * x - a / w * cos(w * x)) * (10.0 + sin(w * x));
    return dydx;
}

float functionMask(float thickness, float blurRadius, vec2 st) {
    float y = function(st.x);
    vec2 target = vec2(st.x, y);
    float dydx = derivative(st.x);
    float angle = atan(dydx);
    vec2 normal = vec2(-sin(angle), cos(angle));
    float thicknessBy2 = thickness / 2.0;
    float distanceToWave = dot(st - target, normal);
    return smoothstep(-blurRadius - thicknessBy2, - thicknessBy2, distanceToWave) -
    smoothstep(thicknessBy2, blurRadius + thicknessBy2, distanceToWave);
}

float lineMask(vec2 start, vec2 end, float thickness, float blurRadius, vec2 st) {
    float lengthOfLine = length(end - start);
    vec2 tangentUnit = (end - start) / lengthOfLine;
    vec2 normalUnit = vec2(-tangentUnit.y, tangentUnit.x);
    float tangentLength = dot(st - start, tangentUnit);
    float normalLength = dot(st - start, normalUnit);
    float thicknessBy2 = thickness / 2.0;
    float tangentMask = smoothstep(-blurRadius, 0.0, tangentLength) -
    smoothstep(lengthOfLine, lengthOfLine + blurRadius, tangentLength);
    float normalMask = smoothstep(-thicknessBy2 - blurRadius, - thicknessBy2, normalLength) -
    smoothstep(thicknessBy2, thicknessBy2 + blurRadius, normalLength);
    return tangentMask * normalMask;
}

void main() {
    vec2 st = gl_FragCoord.xy / u_resolution.xy * 2.0 - vec2(1.0, 1.0);
    float aspectRatio = u_resolution.x / u_resolution.y;
    float r = step(1.0, aspectRatio);
    st.x = st.x * mix(1.0, aspectRatio, r) * 1.5;
    st.y = st.y / mix(aspectRatio, 1.0, r) * 1.5;
    vec3 colour = vec3(0.0, 0.0, 0.0);
    
    vec3 light = vec3(0.0, 0.5, 0.0);
    vec3 glow = vec3(1.0, 1.0, 1.0);
    
    float xAxisLight = lineMask(vec2(-10.0, 0.0), vec2(10.0, 0.0), 0.005, 0.01, st);
    float yAxisLight = lineMask(vec2(0.0, - 10.0), vec2(0.0, 10.0), 0.005, 0.01, st);
    float signalLight = functionMask(0.05, 0.05, vec2(st.x + u_time * 0.5, st.y));
    float signalGlow = functionMask(0.05, 0.0, vec2(st.x + u_time * 0.5, st.y));
    
    colour = mix(colour, light, xAxisLight);
    colour = mix(colour, light, yAxisLight);
    colour = mix(colour, light, signalLight);
    colour = mix(colour, glow, signalGlow);
    gl_FragColor = vec4(colour, 1.0);
}`;

shaders[5] = `uniform float u_time;
uniform vec2 u_resolution;

float function(float x) {
    float y = sin(2.0 * x) + 0.2 * sin(20.0 * x);
    return y;
}

float derivative(float x) {
    float dydx = 2.0 * cos(2.0 * x) + 0.2 * 20.0 * cos(20.0 * x);
    return dydx;
}

float functionMask(float thickness, float blurRadius, vec2 st) {
    float y = function(st.x);
    vec2 target = vec2(st.x, y);
    float dydx = derivative(st.x);
    float angle = atan(dydx);
    vec2 normal = vec2(-sin(angle), cos(angle));
    float thicknessBy2 = thickness / 2.0;
    float distanceToWave = dot(st - target, normal);
    return smoothstep(-blurRadius - thicknessBy2, - thicknessBy2, distanceToWave) -
    smoothstep(thicknessBy2, blurRadius + thicknessBy2, distanceToWave);
}

float lineMask(vec2 start, vec2 end, float thickness, float blurRadius, vec2 st) {
    float lengthOfLine = length(end - start);
    vec2 tangentUnit = (end - start) / lengthOfLine;
    vec2 normalUnit = vec2(-tangentUnit.y, tangentUnit.x);
    float tangentLength = dot(st - start, tangentUnit);
    float normalLength = dot(st - start, normalUnit);
    float thicknessBy2 = thickness / 2.0;
    float tangentMask = smoothstep(-blurRadius, 0.0, tangentLength) -
    smoothstep(lengthOfLine, lengthOfLine + blurRadius, tangentLength);
    float normalMask = smoothstep(-thicknessBy2 - blurRadius, - thicknessBy2, normalLength) -
    smoothstep(thicknessBy2, thicknessBy2 + blurRadius, normalLength);
    return tangentMask * normalMask;
}

void main() {
    vec2 st = gl_FragCoord.xy / u_resolution.xy * 2.0 - vec2(1.0, 1.0);
    float aspectRatio = u_resolution.x / u_resolution.y;
    float r = step(1.0, aspectRatio);
    st.x = st.x * mix(1.0, aspectRatio, r) * 1.5;
    st.y = st.y / mix(aspectRatio, 1.0, r) * 1.5;
    vec3 colour = vec3(0.0, 0.0, 0.0);
    
    vec3 light = vec3(0.0, 0.5, 0.0);
    vec3 glow = vec3(1.0, 1.0, 1.0);
    
    float xAxisLight = lineMask(vec2(-10.0, 0.0), vec2(10.0, 0.0), 0.005, 0.01, st);
    float yAxisLight = lineMask(vec2(0.0, - 10.0), vec2(0.0, 10.0), 0.005, 0.01, st);
    float signalLight = functionMask(0.05, 0.05, vec2(st.x + u_time * 0.5, st.y));
    float signalGlow = functionMask(0.05, 0.0, vec2(st.x + u_time * 0.5, st.y));
    
    colour = mix(colour, light, xAxisLight);
    colour = mix(colour, light, yAxisLight);
    colour = mix(colour, light, signalLight);
    colour = mix(colour, glow, signalGlow);
    gl_FragColor = vec4(colour, 1.0);
}`;

shaders[6] = `uniform float u_time;
uniform vec2 u_resolution;
uniform int degree;

float function(float x) {
    float y = 0.0;
    for(int i = 0; i < 5; i ++ ) {
        y += (1.0 - step(float(degree) - 0.5, float(i))) * 1.0 / float(i * 2 + 1) * sin(2.0 * float(i * 2 + 1) * x);
    }
    // float y = sin(2.0 * x) + 1.0 / 3.0 * sin(6.0 * x) + 1.0 / 5.0 * sin(10.0 * x) + 1.0 / 7.0 * sin(14.0 * x);
    return y;
}

float derivative(float x) {
    float dydx = 0.0;
    for(int i = 0; i < 5; i ++ ) {
        dydx += (1.0 - step(float(degree) - 0.5, float(i))) * 2.0 * cos(2.0 * float(i * 2 + 1) * x);
    }
    // float dydx = 2.0 * cos(2.0 * x) + 2.0 * cos(6.0 * x) + 2.0 * cos(10.0 * x) + 2.0 * cos(14.0 * x);
    return dydx;
}

float functionMask(float thickness, float blurRadius, vec2 st) {
    float y = function(st.x);
    vec2 target = vec2(st.x, y);
    float dydx = derivative(st.x);
    float angle = atan(dydx);
    vec2 normal = vec2(-sin(angle), cos(angle));
    float thicknessBy2 = thickness / 2.0;
    float distanceToWave = dot(st - target, normal);
    return smoothstep(-blurRadius - thicknessBy2, - thicknessBy2, distanceToWave) -
    smoothstep(thicknessBy2, blurRadius + thicknessBy2, distanceToWave);
}

float lineMask(vec2 start, vec2 end, float thickness, float blurRadius, vec2 st) {
    float lengthOfLine = length(end - start);
    vec2 tangentUnit = (end - start) / lengthOfLine;
    vec2 normalUnit = vec2(-tangentUnit.y, tangentUnit.x);
    float tangentLength = dot(st - start, tangentUnit);
    float normalLength = dot(st - start, normalUnit);
    float thicknessBy2 = thickness / 2.0;
    float tangentMask = smoothstep(-blurRadius, 0.0, tangentLength) -
    smoothstep(lengthOfLine, lengthOfLine + blurRadius, tangentLength);
    float normalMask = smoothstep(-thicknessBy2 - blurRadius, - thicknessBy2, normalLength) -
    smoothstep(thicknessBy2, thicknessBy2 + blurRadius, normalLength);
    return tangentMask * normalMask;
}

void main() {
    vec2 st = gl_FragCoord.xy / u_resolution.xy * 2.0 - vec2(1.0, 1.0);
    float aspectRatio = u_resolution.x / u_resolution.y;
    float r = step(1.0, aspectRatio);
    st.x = st.x * mix(1.0, aspectRatio, r) * 1.5;
    st.y = st.y / mix(aspectRatio, 1.0, r) * 1.5;
    vec3 colour = vec3(0.0, 0.0, 0.0);
    
    vec3 light = vec3(0.0, 0.5, 0.0);
    vec3 glow = vec3(1.0, 1.0, 1.0);
    
    float xAxisLight = lineMask(vec2(-10.0, 0.0), vec2(10.0, 0.0), 0.005, 0.01, st);
    float yAxisLight = lineMask(vec2(0.0, - 10.0), vec2(0.0, 10.0), 0.005, 0.01, st);
    float signalLight = functionMask(0.05, 0.05, vec2(st.x + u_time * 0.5, st.y));
    float signalGlow = functionMask(0.05, 0.0, vec2(st.x + u_time * 0.5, st.y));
    
    colour = mix(colour, light, xAxisLight);
    colour = mix(colour, light, yAxisLight);
    colour = mix(colour, light, signalLight);
    colour = mix(colour, glow, signalGlow);
    gl_FragColor = vec4(colour, 1.0);
}`;

shaders[7] = `uniform float u_time;
uniform vec2 u_resolution;
uniform int degree;

float function(float x) {
    float y = 0.0;
    for(int i = 0; i < 5; i ++ ) {
        y += (1.0 - step(float(degree) - 0.5, float(i))) * (1.0 / float(i + 1) * sin(2.0 * float(i + 1) * x));
    }
    // float y = sin(2.0 * x) + 1.0 / 2.0 * sin(4.0 * x) + 1.0 / 3.0 * sin(6.0 * x) + 1.0 / 4.0 * sin(8.0 * x);
    return y;
}

float derivative(float x) {
    float dydx = 0.0;
    for(int i = 0; i < 5; i ++ ) {
        dydx += (1.0 - step(float(degree) - 0.5, float(i))) * 2.0 * cos(2.0 * float(i + 1) * x);
    }
    // float dydx = 2.0 * cos(2.0 * x) + 2.0 * cos(4.0 * x) + 2.0 * cos(6.0 * x) + 2.0 * cos(8.0 * x);
    return dydx;
}

float functionMask(float thickness, float blurRadius, vec2 st) {
    float y = function(st.x);
    vec2 target = vec2(st.x, y);
    float dydx = derivative(st.x);
    float angle = atan(dydx);
    vec2 normal = vec2(-sin(angle), cos(angle));
    float thicknessBy2 = thickness / 2.0;
    float distanceToWave = dot(st - target, normal);
    return smoothstep(-blurRadius - thicknessBy2, - thicknessBy2, distanceToWave) -
    smoothstep(thicknessBy2, blurRadius + thicknessBy2, distanceToWave);
}

float lineMask(vec2 start, vec2 end, float thickness, float blurRadius, vec2 st) {
    float lengthOfLine = length(end - start);
    vec2 tangentUnit = (end - start) / lengthOfLine;
    vec2 normalUnit = vec2(-tangentUnit.y, tangentUnit.x);
    float tangentLength = dot(st - start, tangentUnit);
    float normalLength = dot(st - start, normalUnit);
    float thicknessBy2 = thickness / 2.0;
    float tangentMask = smoothstep(-blurRadius, 0.0, tangentLength) -
    smoothstep(lengthOfLine, lengthOfLine + blurRadius, tangentLength);
    float normalMask = smoothstep(-thicknessBy2 - blurRadius, - thicknessBy2, normalLength) -
    smoothstep(thicknessBy2, thicknessBy2 + blurRadius, normalLength);
    return tangentMask * normalMask;
}

void main() {
    vec2 st = gl_FragCoord.xy / u_resolution.xy * 2.0 - vec2(1.0, 1.0);
    float aspectRatio = u_resolution.x / u_resolution.y;
    float r = step(1.0, aspectRatio);
    st.x = st.x * mix(1.0, aspectRatio, r) * 1.5;
    st.y = st.y / mix(aspectRatio, 1.0, r) * 1.5;
    vec3 colour = vec3(0.0, 0.0, 0.0);
    
    vec3 light = vec3(0.0, 0.5, 0.0);
    vec3 glow = vec3(1.0, 1.0, 1.0);
    
    float xAxisLight = lineMask(vec2(-10.0, 0.0), vec2(10.0, 0.0), 0.005, 0.01, st);
    float yAxisLight = lineMask(vec2(0.0, - 10.0), vec2(0.0, 10.0), 0.005, 0.01, st);
    float signalLight = functionMask(0.05, 0.05, vec2(st.x + u_time * 0.5, st.y));
    float signalGlow = functionMask(0.05, 0.0, vec2(st.x + u_time * 0.5, st.y));
    
    colour = mix(colour, light, xAxisLight);
    colour = mix(colour, light, yAxisLight);
    colour = mix(colour, light, signalLight);
    colour = mix(colour, glow, signalGlow);
    gl_FragColor = vec4(colour, 1.0);
}`;

shaders[8] = `uniform float u_time;
uniform vec2 u_resolution;
uniform float a1;
uniform float a2;
uniform float a3;
uniform float a4;
uniform float a5;

float function(float x) {
    float y = 0.0;
    y += a1 * sin(2.0 * x);
    y += a2 * sin(4.0 * x);
    y += a3 * sin(6.0 * x);
    y += a4 * sin(8.0 * x);
    y += a5 * sin(10.0 * x);
    // float y = sin(2.0 * x) + 1.0 / 2.0 * sin(4.0 * x) + 1.0 / 3.0 * sin(6.0 * x) + 1.0 / 4.0 * sin(8.0 * x);
    return y;
}

float derivative(float x) {
    float dydx = 0.0;
    dydx += a1 * 2.0 * cos(2.0 * x);
    dydx += a2 * 4.0 * cos(4.0 * x);
    dydx += a3 * 6.0 * cos(6.0 * x);
    dydx += a4 * 8.0 * cos(8.0 * x);
    dydx += a5 * 10.0 * cos(10.0 * x);
    // float dydx = 2.0 * cos(2.0 * x) + 2.0 * cos(4.0 * x) + 2.0 * cos(6.0 * x) + 2.0 * cos(8.0 * x);
    return dydx;
}

float functionMask(float thickness, float blurRadius, vec2 st) {
    float y = function(st.x);
    vec2 target = vec2(st.x, y);
    float dydx = derivative(st.x);
    float angle = atan(dydx);
    vec2 normal = vec2(-sin(angle), cos(angle));
    float thicknessBy2 = thickness / 2.0;
    float distanceToWave = dot(st - target, normal);
    return smoothstep(-blurRadius - thicknessBy2, - thicknessBy2, distanceToWave) -
    smoothstep(thicknessBy2, blurRadius + thicknessBy2, distanceToWave);
}

float lineMask(vec2 start, vec2 end, float thickness, float blurRadius, vec2 st) {
    float lengthOfLine = length(end - start);
    vec2 tangentUnit = (end - start) / lengthOfLine;
    vec2 normalUnit = vec2(-tangentUnit.y, tangentUnit.x);
    float tangentLength = dot(st - start, tangentUnit);
    float normalLength = dot(st - start, normalUnit);
    float thicknessBy2 = thickness / 2.0;
    float tangentMask = smoothstep(-blurRadius, 0.0, tangentLength) -
    smoothstep(lengthOfLine, lengthOfLine + blurRadius, tangentLength);
    float normalMask = smoothstep(-thicknessBy2 - blurRadius, - thicknessBy2, normalLength) -
    smoothstep(thicknessBy2, thicknessBy2 + blurRadius, normalLength);
    return tangentMask * normalMask;
}

void main() {
    vec2 st = gl_FragCoord.xy / u_resolution.xy * 2.0 - vec2(1.0, 1.0);
    float aspectRatio = u_resolution.x / u_resolution.y;
    float r = step(1.0, aspectRatio);
    st.x = st.x * mix(1.0, aspectRatio, r) * 1.5;
    st.y = st.y / mix(aspectRatio, 1.0, r) * 1.5;
    vec3 colour = vec3(0.0, 0.0, 0.0);
    
    vec3 light = vec3(0.0, 0.5, 0.0);
    vec3 glow = vec3(1.0, 1.0, 1.0);
    
    float xAxisLight = lineMask(vec2(-10.0, 0.0), vec2(10.0, 0.0), 0.005, 0.01, st);
    float yAxisLight = lineMask(vec2(0.0, - 10.0), vec2(0.0, 10.0), 0.005, 0.01, st);
    float signalLight = functionMask(0.05, 0.05, vec2(st.x + u_time * 0.5, st.y));
    float signalGlow = functionMask(0.05, 0.0, vec2(st.x + u_time * 0.5, st.y));
    
    colour = mix(colour, light, xAxisLight);
    colour = mix(colour, light, yAxisLight);
    colour = mix(colour, light, signalLight);
    colour = mix(colour, glow, signalGlow);
    gl_FragColor = vec4(colour, 1.0);
}`;

shaders[9] = `uniform float u_time;
uniform vec2 u_resolution;

float circleOutlineMask(vec2 centre, float r, float thickness, float blurRadius, vec2 st) {
    vec2 diff = st - centre;
    float length2 = dot(diff, diff);
    float solidLeft2 = pow(r - thickness / 2.0, 2.0);
    float solidRight2 = pow(r + thickness / 2.0, 2.0);
    float blurLeft2 = pow(r - thickness / 2.0 - blurRadius, 2.0);
    float blurRight2 = pow(r + thickness / 2.0 + blurRadius, 2.0);
    return smoothstep(blurLeft2, solidLeft2, length2) - smoothstep(solidRight2, blurRight2, length2);
}

float circleMask(vec2 centre, float r, float blurRadius, vec2 st) {
    vec2 difference = st - centre;
    float distance2 = dot(difference, difference);
    float solid2 = pow(r, 2.0);
    float blur2 = pow(r + blurRadius, 2.0);
    return 1.0 - smoothstep(solid2, blur2, distance2);
}

float lineMask(vec2 start, vec2 end, float thickness, float blurRadius, vec2 st) {
    float lengthOfLine = length(end - start);
    vec2 tangentUnit = (end - start) / lengthOfLine;
    vec2 normalUnit = vec2(-tangentUnit.y, tangentUnit.x);
    float tangentLength = dot(st - start, tangentUnit);
    float normalLength = dot(st - start, normalUnit);
    float thicknessBy2 = thickness / 2.0;
    float tangentMask = smoothstep(-blurRadius, 0.0, tangentLength) -
    smoothstep(lengthOfLine, lengthOfLine + blurRadius, tangentLength);
    float normalMask = smoothstep(-thicknessBy2 - blurRadius, - thicknessBy2, normalLength) -
    smoothstep(thicknessBy2, thicknessBy2 + blurRadius, normalLength);
    return tangentMask * normalMask;
}

void main() {
    vec2 st = gl_FragCoord.xy / u_resolution.xy * 2.0 - vec2(1.0, 1.0);
    float aspectRatio = u_resolution.x / u_resolution.y;
    float r = step(1.0, aspectRatio);
    st.x = st.x * mix(1.0, aspectRatio, r) * 1.5;
    st.y = st.y / mix(aspectRatio, 1.0, r) * 1.5;
    vec3 colour = vec3(0.0, 0.0, 0.0);
    
    vec3 light = vec3(0.0, 0.5, 0.0);
    vec3 glow = vec3(1.0, 1.0, 1.0);
    
    float xAxisLight = lineMask(vec2(-10.0, 0.0), vec2(10.0, 0.0), 0.005, 0.01, st);
    float yAxisLight = lineMask(vec2(0.0, - 10.0), vec2(0.0, 10.0), 0.005, 0.01, st);
    float circleLight = circleOutlineMask(vec2(0.0, 0.0), 1.0, 0.03, 0.03, st);
    float circleGlow = circleOutlineMask(vec2(0.0, 0.0), 1.0, 0.03, 0.0, st);
    float pointLight = circleMask(vec2(cos(u_time * 0.5), sin(u_time * 0.5)), 0.05, 0.05, st);
    float pointGlow = circleMask(vec2(cos(u_time * 0.5), sin(u_time * 0.5)), 0.05, 0.0, st);
    colour = mix(colour, light, xAxisLight);
    colour = mix(colour, light, yAxisLight);
    colour = mix(colour, light, circleLight);
    colour = mix(colour, glow, circleGlow);
    colour = mix(colour, light, pointLight);
    colour = mix(colour, glow, pointGlow);
    gl_FragColor = vec4(colour, 1.0);
}`;

shaders[10] = `uniform float u_time;
uniform vec2 u_resolution;

vec2 paramFunction(float theta, float phaseOffset) {
    float x = 1.5 * sin(theta + phaseOffset);
    float y = (1.0 + 0.5 * cos(u_time * 0.5)) * sin(theta);
    return vec2(x, y);
}

vec2 paramDerivative(float theta, float phaseOffset) {
    float dxdt = 1.5 * cos(theta + phaseOffset);
    float dydt = (1.0 + 0.5 * cos(u_time * 0.5)) * cos(theta);
    return vec2(dxdt, dydt);
}

float paramBranchMask(float thickness, float blurRadius, float theta, float phaseOffset, vec2 st) {
    vec2 derivative = paramDerivative(theta, phaseOffset);
    float dydx = derivative.y / derivative.x;
    float angle = atan(dydx);
    vec2 normal = vec2(-sin(angle), cos(angle));
    float normalIsInvalid = step(-0.15, derivative.x) - step(0.15, derivative.x);
    normal = mix(normal, vec2(0, 1), normalIsInvalid);
    vec2 target = paramFunction(theta, phaseOffset);
    float thicknessBy2 = thickness / 2.0;
    float distanceToWave = dot(st - target, normal);
    return smoothstep(-blurRadius - thicknessBy2, - thicknessBy2, distanceToWave) -
    smoothstep(thicknessBy2, blurRadius + thicknessBy2, distanceToWave);
}

float paramMask(float thickness, float blurRadius, float phaseOffset, vec2 st) {
    float theta = asin(st.x / 1.5) - phaseOffset;
    float mask = paramBranchMask(thickness, blurRadius, theta, phaseOffset, st);
    theta = 3.14159265358 - asin(st.x / 1.5) - phaseOffset;
    mask = mask + paramBranchMask(thickness, blurRadius, theta, phaseOffset, st);
    return mask;
}

float lineMask(vec2 start, vec2 end, float thickness, float blurRadius, vec2 st) {
    float lengthOfLine = length(end - start);
    vec2 tangentUnit = (end - start) / lengthOfLine;
    vec2 normalUnit = vec2(-tangentUnit.y, tangentUnit.x);
    float tangentLength = dot(st - start, tangentUnit);
    float normalLength = dot(st - start, normalUnit);
    float thicknessBy2 = thickness / 2.0;
    float tangentMask = smoothstep(-blurRadius, 0.0, tangentLength) -
    smoothstep(lengthOfLine, lengthOfLine + blurRadius, tangentLength);
    float normalMask = smoothstep(-thicknessBy2 - blurRadius, - thicknessBy2, normalLength) -
    smoothstep(thicknessBy2, thicknessBy2 + blurRadius, normalLength);
    return tangentMask * normalMask;
}

void main() {
    vec2 st = gl_FragCoord.xy / u_resolution.xy * 2.0 - vec2(1.0, 1.0);
    float aspectRatio = u_resolution.x / u_resolution.y;
    float r = step(1.0, aspectRatio);
    st.x = st.x * mix(1.0, aspectRatio, r) * 1.5;
    st.y = st.y / mix(aspectRatio, 1.0, r) * 1.5;
    vec3 colour = vec3(0.0, 0.0, 0.0);
    
    vec3 light = vec3(0.0, 0.5, 0.0);
    vec3 glow = vec3(1.0, 1.0, 1.0);
    
    float xAxisLight = lineMask(vec2(-10.0, 0.0), vec2(10.0, 0.0), 0.005, 0.01, st);
    float yAxisLight = lineMask(vec2(0.0, - 10.0), vec2(0.0, 10.0), 0.005, 0.01, st);
    float ellipseLight = paramMask(0.05, 0.05, 3.14159265358 / 2.0, st);
    float ellipseGlow = paramMask(0.05, 0.0, 3.14159265358 / 2.0, st);
    colour = mix(colour, light, xAxisLight);
    colour = mix(colour, light, yAxisLight);
    colour = mix(colour, light, ellipseLight);
    colour = mix(colour, glow, ellipseGlow);
    gl_FragColor = vec4(colour, 1.0);
}
`;

shaders[11] = `uniform float u_time;
uniform vec2 u_resolution;
uniform float freqX;
uniform float freqY;

#define PI 3.14159265358

vec2 paramFunction(float theta, float phaseOffset) {
    float x = sin(freqX * theta + phaseOffset);
    float y = sin(freqY * theta);
    return vec2(x, y);
}

vec2 paramDerivative(float theta, float phaseOffset) {
    float dxdt = freqX * cos(freqX * theta + phaseOffset);
    float dydt = freqY * cos(freqY * theta);
    return vec2(dxdt, dydt);
}

float paramBranchMask(float thickness, float blurRadius, float theta, float phaseOffset, vec2 st) {
    vec2 derivative = paramDerivative(theta, phaseOffset);
    vec2 normal = normalize(vec2(-derivative.y, derivative.x));
    vec2 target = paramFunction(theta, phaseOffset);
    float thicknessBy2 = thickness / 2.0;
    float distanceToWave = dot(st - target, normal);
    return smoothstep(-blurRadius - thicknessBy2, - thicknessBy2, distanceToWave) -
    smoothstep(thicknessBy2, blurRadius + thicknessBy2, distanceToWave);
}

float paramMask(float thickness, float blurRadius, float phaseOffset, vec2 st) {
    float theta = 0.0;
    float mask = 0.0;
    for(int i = 0; i < 5; i ++ ) {
        theta = (asin(st.x) - phaseOffset + PI * float(2 * i)) / freqX;
        mask = mask + paramBranchMask(thickness, blurRadius, theta, phaseOffset, st);
        theta = (3.14159265358 - asin(st.x) - phaseOffset + PI * float(2 * i)) / freqX;
        mask = mask + paramBranchMask(thickness, blurRadius, theta, phaseOffset, st);
    }
    return clamp(mask, 0.0, 1.0);
}

void main() {
    vec2 st = gl_FragCoord.xy / u_resolution.xy * 2.0 - vec2(1.0, 1.0);
    float aspectRatio = u_resolution.x / u_resolution.y;
    float r = step(1.0, aspectRatio);
    st.x = st.x * mix(1.0, aspectRatio, r);
    st.y = st.y / mix(aspectRatio, 1.0, r);
    vec3 colour = vec3(0.0, 0.0, 0.0);
    
    vec3 light = vec3(0.0, 0.5, 0.0);
    vec3 glow = vec3(1.0, 1.0, 1.0);
    
    float lissajous = paramMask(0.02, 0.02, u_time * 0.1, st);
    float lissajousGlow = paramMask(0.02, 0.0, u_time * 0.1, st);
    colour = mix(colour, light, lissajous);
    colour = mix(colour, glow, lissajousGlow);
    
    gl_FragColor = vec4(colour, 1.0);
}`;

shaders[12] = `uniform float u_time;
uniform vec2 u_resolution;

#define PI 3.14159265358

vec2 paramFunction(float theta, float phaseOffset) {
    float x = sin(4.0 * theta + phaseOffset);
    float y = sin(5.0 * theta);
    return vec2(x, y);
}

vec2 paramDerivative(float theta, float phaseOffset) {
    float dxdt = 4.0 * cos(4.0 * theta + phaseOffset);
    float dydt = 5.0 * cos(5.0 * theta);
    return vec2(dxdt, dydt);
}

float paramBranchMask(float thickness, float blurRadius, float theta, float phaseOffset, vec2 st) {
  vec2 derivative = paramDerivative(theta, phaseOffset);
  vec2 normal = normalize(vec2(-derivative.y, derivative.x));
  vec2 target = paramFunction(theta, phaseOffset);
  float thicknessBy2 = thickness / 2.0;
  float distanceToWave = dot(st - target, normal);
  return smoothstep(-blurRadius - thicknessBy2, - thicknessBy2, distanceToWave) -
  smoothstep(thicknessBy2, blurRadius + thicknessBy2, distanceToWave);
}

float paramMask(float thickness, float blurRadius, float phaseOffset, vec2 st) {
    float theta = 0.0;
    float mask = 0.0;
    for(int i = 0; i < 4; i ++ ) {
        theta = (asin(st.x) - phaseOffset + PI * float(2 * i)) / 4.0;
        mask = mask + paramBranchMask(thickness, blurRadius, theta, phaseOffset, st);
        theta = (3.14159265358 - asin(st.x) - phaseOffset + PI * float(2 * i)) / 4.0;
        mask = mask + paramBranchMask(thickness, blurRadius, theta, phaseOffset, st);
    }
    return clamp(mask, 0.0, 1.0);
}

float circleMask(vec2 centre, float r, float blurRadius, vec2 st) {
    vec2 difference = st - centre;
    float distance2 = dot(difference, difference);
    float solid2 = pow(r, 2.0);
    float blur2 = pow(r + blurRadius, 2.0);
    return 1.0 - smoothstep(solid2, blur2, distance2);
}

void main() {
    vec2 st = gl_FragCoord.xy / u_resolution.xy * 2.0 - vec2(1.0, 1.0);
    float aspectRatio = u_resolution.x / u_resolution.y;
    float r = step(1.0, aspectRatio);
    st.x = st.x * mix(1.0, aspectRatio, r);
    st.y = st.y / mix(aspectRatio, 1.0, r);
    vec3 colour = vec3(0.0, 0.0, 0.0);
    
    vec3 skyColour = vec3(0.0, 0.0, 0.3);
    vec3 groundColour = vec3(0.0, 0.0, 0.5);
    vec3 fireflyColour = vec3(1.0, 1.0, 0.0);
    vec3 glowColour = vec3(1.0, 1.0, 1.0);
    vec3 pathColour = vec3(0.0, 0.0, 0.0);
    colour = mix(groundColour, skyColour, st.y);
    
    float pathMask = 0.2 * paramMask(0.02, 0.0, 0.0, st);
    float lightMask = 0.0;
    float glowMask = 0.0;
    for(int i = 0; i < 50; i ++ ) {
        float phase = PI / 25.0 * float(i) + u_time * 0.01;
        vec2 location = paramFunction(phase, 0.0);
        lightMask = lightMask + circleMask(location, 0.01, 0.02, st);
        glowMask = glowMask + circleMask(location, 0.01, 0.0, st);
    }
    lightMask = clamp(lightMask, 0.0, 1.0);
    glowMask = clamp(glowMask, 0.0, 1.0);
    colour = mix(colour, pathColour, pathMask);
    colour = mix(colour, fireflyColour, lightMask);
    colour = mix(colour, glowColour, glowMask);
    
    gl_FragColor = vec4(colour, 1.0);
}`;

const vertexShader = `
void main() {
    gl_Position = vec4(position, 1.0);
}
`;

const uniforms = [
  {
    u_time: { type: "f", value: 1.0 },
    u_resolution: { type: "v2", value: new THREE.Vector2() }
  },
  {
    u_time: { type: "f", value: 1.0 },
    u_resolution: { type: "v2", value: new THREE.Vector2() }
  },
  {
    u_time: { type: "f", value: 1.0 },
    u_resolution: { type: "v2", value: new THREE.Vector2() }
  },
  {
    u_time: { type: "f", value: 1.0 },
    u_resolution: { type: "v2", value: new THREE.Vector2() },
    a: { type: "f", value: 0.1 },
    w: { type: "f", value: 1.0 }
  },
  {
    u_time: { type: "f", value: 1.0 },
    u_resolution: { type: "v2", value: new THREE.Vector2() },
    a: { type: "f", value: 2.0 },
    w: { type: "f", value: 1.0 }
  },
  {
    u_time: { type: "f", value: 1.0 },
    u_resolution: { type: "v2", value: new THREE.Vector2() }
  },
  {
    u_time: { type: "f", value: 1.0 },
    u_resolution: { type: "v2", value: new THREE.Vector2() },
    degree: { type: "i", value: 3 }
  },
  {
    u_time: { type: "f", value: 1.0 },
    u_resolution: { type: "v2", value: new THREE.Vector2() },
    degree: { type: "i", value: 3 }
  },
  {
    u_time: { type: "f", value: 1.0 },
    u_resolution: { type: "v2", value: new THREE.Vector2() },
    a1: { type: "f", value: 1.0 },
    a2: { type: "f", value: 0.0 },
    a3: { type: "f", value: 0.0 },
    a4: { type: "f", value: 0.0 },
    a5: { type: "f", value: 0.0 }
  },
  {
    u_time: { type: "f", value: 1.0 },
    u_resolution: { type: "v2", value: new THREE.Vector2() }
  },
  {
    u_time: { type: "f", value: 1.0 },
    u_resolution: { type: "v2", value: new THREE.Vector2() }
  },
  {
    u_time: { type: "f", value: 1.0 },
    u_resolution: { type: "v2", value: new THREE.Vector2() },
    freqX: { type: "f", value: 1.0 },
    freqY: { type: "f", value: 1.0 }
  },
  {
    u_time: { type: "f", value: 1.0 },
    u_resolution: { type: "v2", value: new THREE.Vector2() }
  }
];

const shaderMaterials = shaders.map(
  (shader, index) =>
    new THREE.ShaderMaterial({
      uniforms: uniforms[index],
      vertexShader: vertexShader,
      fragmentShader: shader
    })
);

const inputs = [
  [],
  [],
  [],
  [
    document.getElementById("slide-4-a-input"),
    document.getElementById("slide-4-w-input")
  ],
  [
    document.getElementById("slide-5-a-input"),
    document.getElementById("slide-5-w-input")
  ],
  [],
  [document.getElementById("slide-7-degree-input")],
  [document.getElementById("slide-8-degree-input")],
  [
    document.getElementById("slide-9-a1-input"),
    document.getElementById("slide-9-a2-input"),
    document.getElementById("slide-9-a3-input"),
    document.getElementById("slide-9-a4-input"),
    document.getElementById("slide-9-a5-input")
  ],
  [],
  [],
  [
    document.getElementById("slide-12-xfreq-input"),
    document.getElementById("slide-12-yfreq-input")
  ],
  []
];

const values = [
  [],
  [],
  [],
  [
    document.getElementById("slide-4-a-value"),
    document.getElementById("slide-4-w-value")
  ],
  [
    document.getElementById("slide-5-a-value"),
    document.getElementById("slide-5-w-value")
  ],
  [],
  [document.getElementById("slide-7-degree-value")],
  [document.getElementById("slide-8-degree-value")],
  [
    document.getElementById("slide-9-a1-value"),
    document.getElementById("slide-9-a2-value"),
    document.getElementById("slide-9-a3-value"),
    document.getElementById("slide-9-a4-value"),
    document.getElementById("slide-9-a5-value")
  ],
  [],
  [],
  [
    document.getElementById("slide-12-xfreq-value"),
    document.getElementById("slide-12-yfreq-value")
  ],
  []
];

const changeListeners = [
  [],
  [],
  [],
  [
    value => {
      shaderMaterials[3].uniforms.a.value = value;
    },
    value => {
      shaderMaterials[3].uniforms.w.value = value;
    }
  ],
  [
    value => {
      shaderMaterials[4].uniforms.a.value = value;
    },
    value => {
      shaderMaterials[4].uniforms.w.value = value;
    }
  ],
  [],
  [
    value => {
      shaderMaterials[6].uniforms.degree.value = value;
    }
  ],
  [
    value => {
      shaderMaterials[7].uniforms.degree.value = value;
    }
  ],
  [
    value => {
      shaderMaterials[8].uniforms.a1.value = value;
    },
    value => {
      shaderMaterials[8].uniforms.a2.value = value;
    },
    value => {
      shaderMaterials[8].uniforms.a3.value = value;
    },
    value => {
      shaderMaterials[8].uniforms.a4.value = value;
    },
    value => {
      shaderMaterials[8].uniforms.a5.value = value;
    }
  ],
  [],
  [],
  [
    value => {
      shaderMaterials[11].uniforms.freqX.value = value;
    },
    value => {
      shaderMaterials[11].uniforms.freqY.value = value;
    }
  ],
  []
];
