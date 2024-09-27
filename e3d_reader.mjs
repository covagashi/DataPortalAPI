// Guarda este archivo como e3d_reader.mjs

class Bvt {
    _url;
    _authorizationToken;
    _buffer;
    _filePos;
    _formatVersion;
    constructor(i, e) {
        this._url = i,
        this._authorizationToken = e
    }
    loadSceneData() {
        var i = this;
        return y(function*() {
            const e = i._authorizationToken ? {
                headers: new Headers({
                    Authorization: i._authorizationToken
                })
            } : void 0;
            return fetch(i._url, e).then(n => n.arrayBuffer()).then(n => {
                if (i._buffer = n,
                i._filePos = 0,
                i._formatVersion = i._loadByte(),
                !(i._formatVersion <= 4))
                    return Promise.reject("Error loading E3D model!");
                {
                    var r = {
                        view: {}
                    };
                    r.view.modelTransform = i._loadTransform(),
                    r.view.viewBox = i._loadVector(),
                    r.view.viewColors = {},
                    r.view.viewColors.top = i._loadColor(),
                    r.view.viewColors.bottom = i._loadColor();
                    const o = s => {
                        const a = i._loadLong();
                        return Array.from(Array(a), () => s.bind(i)())
                    }
                    ;
                    if (r.lights = o(i._loadLight),
                    r.textures = o(i._loadTexture),
                    r.meshes = o(i._loadMesh),
                    r.parts = o(i._loadPart),
                    i._filePos != i._buffer.byteLength)
                        return Promise.reject("Error loading E3D model!")
                }
                return r
            }
            )
        })()
    }
    _getViewAndAdvance(i) {
        const e = new DataView(this._buffer,this._filePos,i);
        return this._filePos += i,
        e
    }
    _loadByte = () => this._getViewAndAdvance(Uint8Array.BYTES_PER_ELEMENT).getUint8(0);
    _loadShort = () => this._getViewAndAdvance(Int16Array.BYTES_PER_ELEMENT).getInt16(0, !0);
    _loadLong = () => this._getViewAndAdvance(Int32Array.BYTES_PER_ELEMENT).getInt32(0, !0);
    _loadFloat = () => this._getViewAndAdvance(Float32Array.BYTES_PER_ELEMENT).getFloat32(0, !0);
    _loadColor() {
        for (var i = this._getViewAndAdvance(4 * Uint8Array.BYTES_PER_ELEMENT), e = new Float32Array(4), n = 0; n < 4; ++n) {
            var r = i.getUint8(n * Uint8Array.BYTES_PER_ELEMENT);
            e[n] = r / 255
        }
        return e[3] = 1 - e[3],
        e
    }
    _loadVector() {
        var i = this._getViewAndAdvance(3 * Float32Array.BYTES_PER_ELEMENT)
          , e = new Float32Array(3);
        return e[0] = i.getFloat32(0 * Float32Array.BYTES_PER_ELEMENT, !0),
        e[1] = i.getFloat32(1 * Float32Array.BYTES_PER_ELEMENT, !0),
        e[2] = i.getFloat32(2 * Float32Array.BYTES_PER_ELEMENT, !0),
        e
    }
    _loadFloatBuffer() {
        for (var i = this._getViewAndAdvance(this._loadLong()), e = i.byteLength / Float32Array.BYTES_PER_ELEMENT, n = new Float32Array(e), r = 0; r < e; ++r)
            n[r] = i.getFloat32(r * Float32Array.BYTES_PER_ELEMENT, !0);
        return n
    }
    _loadShortBuffer() {
        for (var i = this._getViewAndAdvance(this._loadLong()), e = i.byteLength / Uint16Array.BYTES_PER_ELEMENT, n = new Uint16Array(e), r = 0; r < e; ++r)
            n[r] = i.getUint8(2 * r * Uint8Array.BYTES_PER_ELEMENT) + 256 * i.getUint8((2 * r + 1) * Uint8Array.BYTES_PER_ELEMENT);
        return n
    }
    _loadByteBuffer() {
        for (var i = this._getViewAndAdvance(this._loadLong()), e = new Uint8Array(i.byteLength), n = 0; n < i.byteLength; ++n)
            e[n] = i.getUint8(n * Uint8Array.BYTES_PER_ELEMENT);
        return e
    }
    _loadString() {
        for (var i = this._getViewAndAdvance(this._loadLong()), e = "", n = 0; n < Math.floor(i.byteLength / 2); ++n) {
            const r = i.getUint8(2 * n * Uint8Array.BYTES_PER_ELEMENT) + 256 * i.getUint8((2 * n + 1) * Uint8Array.BYTES_PER_ELEMENT);
            0 != r && (e += String.fromCharCode(r))
        }
        return e
    }
    _loadTransform() {
        const i = this._loadVector()
          , e = this._loadVector()
          , n = this._loadVector()
          , r = this._loadVector();
        return [i[0], i[1], i[2], 0, e[0], e[1], e[2], 0, n[0], n[1], n[2], 0, r[0], r[1], r[2], 1]
    }
    _loadLight() {
        var i = {};
        return i.nLightType = this._loadByte(),
        i.color = this._loadColor(),
        (2 == i.nLightType || 3 == i.nLightType) && (i.position = this._loadVector()),
        (1 == i.nLightType || 3 == i.nLightType) && (i.direction = this._loadVector()),
        3 == i.nLightType && (i.fAngle = this._loadFloat(),
        i.fExponent = this._loadFloat()),
        i
    }
    _loadTexture() {
        var i = {};
        return this._loadByte(),
        i.sWidth = this._loadShort(),
        i.sHeight = this._loadShort(),
        i.nComponents = 4,
        i.nSize = i.sWidth * i.sHeight * i.nComponents,
        i.vData = new Uint8Array(this._buffer,this._filePos,i.nSize),
        this._filePos += Uint8Array.BYTES_PER_ELEMENT * i.nSize,
        i
    }
    _loadMaterial() {
        var i = {};
        return i.bColorValid = this._loadByte() > 0,
        i.oColor = this._loadColor(),
        i.nTextureId = this._loadShort(),
        i
    }
    _loadEdgeStyle() {
        var i = {};
        return i.oColor = this._loadColor(),
        i.fLineWidth = this._loadFloat(),
        i.ucLineType = this._loadByte(),
        i
    }
    _loadElements() {
        var i = {
            bCenterValid: !1
        };
        this._formatVersion >= 2 && (i.vCenter = this._loadVector(),
        i.bCenterValid = !0);
        var e = this._loadByte();
        i.mode = ["points", "lineStrip", "lineLoop", "lines", "triangleStrip", "triangleFan", "triangles"][e],
        i.length = this._loadLong();
        var r = this._loadByte();
        return i.type = ["unsignedByte", "unsignedShort"][r],
        i.vArray = "unsignedByte" == i.type ? this._loadByteBuffer() : this._loadShortBuffer(),
        i
    }
    _loadMesh() {
        var i = {
            vertexbuffer: {}
        }
          , e = this._loadByte();
        i.vertexbuffer.bPoints = (1 & e) > 0,
        i.vertexbuffer.bNormals = (2 & e) > 0,
        i.vertexbuffer.bTexCoords = (4 & e) > 0,
        i.vertexbuffer.vArray = this._loadFloatBuffer();
        var n = this._loadLong();
        i.faceElements = new Array(n);
        for (var r = 0; r < n; ++r) {
            var o = {};
            o.material = this._loadMaterial(),
            o.elements = this._loadElements(),
            i.faceElements[r] = o
        }
        var s = this._loadLong();
        for (i.edgeElements = new Array(s),
        r = 0; r < s; ++r) {
            var a = {};
            a.edgestyle = this._loadEdgeStyle(),
            a.elements = this._loadElements(),
            i.edgeElements[r] = a
        }
        return i
    }
    _loadPart() {
        var i = {};
        if (i.nMeshId = this._loadShort(),
        i.oTransform = this._loadTransform(),
        i.oColor = this._loadColor(),
        this._formatVersion >= 3 && (i.nTypeId = this._loadShort(),
        i.nTblObjId = this._loadLong()),
        this._formatVersion >= 4) {
            var e = this._loadLong();
            i.textLines = new Array(e);
            for (var n = 0; n < e; ++n) {
                var r = {};
                r.oTransform = this._loadTransform(),
                r.fHeight = this._loadFloat();
                var o = this._loadShort();
                switch (r.vecTextJust = new Float32Array([0, 0, .1, 1]),
                o) {
                case 2:
                case 5:
                case 8:
                case 11:
                    r.vecTextJust[0] = -.5;
                    break;
                case 3:
                case 6:
                case 9:
                case 12:
                    r.vecTextJust[0] = -1
                }
                switch (o) {
                case 1:
                case 2:
                case 3:
                    r.vecTextJust[1] = -1;
                    break;
                case 4:
                case 5:
                case 6:
                    r.vecTextJust[1] = -.5
                }
                r.strText = this._loadString(),
                i.textLines[n] = r
            }
        }
        return i
    }
}

class ck {
    _renderer;
    _textMaterial;
    _textData = [];
    _matMap = new Map;
    _modelOpCount = 0;
    _modelsLoaded = 0;
    _rendererOptimized = !1;
    constructor(i) {
        if (!i.supportedDataLayouts.includes(1))
            throw "Unsupported data layout version: 1. E3dLoader requires a matching Renderer.";
        this._renderer = i
    }
    loadE3d(i, e) {
        var n = this;
        return y(function*() {
            e ? e.instancingThreshold || (e.instancingThreshold = 8) : e = {
                singleModelViewingMode: !1,
                instancingThreshold: 8
            };
            const r = n._renderer;
            n._modelOpCount++,
            e.quietMode || r.setOverlayState(!0, `Loading ${i}...`);
            var o = yield new Bvt(i,e.authorizationToken).loadSceneData()
              , s = [];
            if (o.parts.forEach(ge => {
                s[ge.nMeshId] = (s[ge.nMeshId] || 0) + 1
            }
            ),
            n._rendererOptimized)
                console.warn("Renderer fragmentation was already optimized for a model loaded by a previous loadE3d() call!");
            else if (e.singleModelViewingMode) {
                var a = [];
                if (0 == n._modelsLoaded) {
                    var c = [0, 0, 0];
                    for (const ge of o.parts) {
                        if (e.skipTypeIds && e.skipTypeIds.includes(ge.nTypeId) || (c[1] += 7 * ge.textLines.length * 16,
                        c[2] += 12 * ge.textLines.length * 28,
                        a[ge.nMeshId]))
                            continue;
                        const nt = ck._countMeshVertices(o.meshes[ge.nMeshId]);
                        c[0] += 20 * nt.triangle,
                        c[1] += 16 * nt.line + 32,
                        c[2] += 28 * nt.triangleTextured,
                        s[ge.nMeshId] > e.instancingThreshold && (a[ge.nMeshId] = !0)
                    }
                    c = c.map(ge => Math.max(2 ** 23, ge)),
                    r.setBufferFragmentation(c),
                    n._rendererOptimized = !0
                } else
                    console.warn("Other models loaded or loading, cannot optimize for a single model!")
            }
            n._modelsLoaded++;
            var l = r.createNode();
            l.name = `E3D: ${i}`;
            var d = r.createNode();
            function m(ge) {
                for (var nt = 0; nt < ge.length; nt += 4)
                    [ge[nt + 0],ge[nt + 2]] = [ge[nt + 2], ge[nt + 0]];
                return ge
            }
            d.name = "Z-up to Y-up",
            d.matrix = [1, 0, 0, 0, 0, 0, -1, 0, 0, 1, 0, 0, 0, 0, 0, 1],
            l.addChild(d);
            const C = o.textures.map(ge => [new ImageData(new Uint8ClampedArray(m(ge.vData)),ge.sWidth,ge.sHeight), null]);
            var U, w = yield r.createTextures(C), _ = [], T = !1, L = !1;
            try {
                for (var se, q = function kvt(t) {
                    var i, e, n, r = 2;
                    for (typeof Symbol < "u" && (e = Symbol.asyncIterator,
                    n = Symbol.iterator); r--; ) {
                        if (e && null != (i = t[e]))
                            return i.call(t);
                        if (n && null != (i = t[n]))
                            return new zV(i.call(t));
                        e = "@@asyncIterator",
                        n = "@@iterator"
                    }
                    throw new TypeError("Object is not async iterable")
                }(o.parts); T = !(se = yield q.next()).done; T = !1) {
                    const ge = se.value;
                    var ue;
                    e.skipTypeIds && e.skipTypeIds.includes(ge.nTypeId) || (null == _[ge.nMeshId] ? (ue = yield n._storeMesh(o.meshes[ge.nMeshId], ge.oColor, ge.oTransform, w, e.disableTexts ? [] : ge.textLines, null),
                    s[ge.nMeshId] > e.instancingThreshold && (_[ge.nMeshId] = ue)) : ue = yield n._storeMesh(o.meshes[ge.nMeshId], ge.oColor, ge.oTransform, w, e.disableTexts ? [] : ge.textLines, _[ge.nMeshId]),
                    ue.userProperties.set("nTypeId", ge.nTypeId),
                    ue.userProperties.set("nTblObjId", ge.nTblObjId),
                    e.nodeTag && ue.userProperties.set("tag", e.nodeTag),
                    d.addChild(ue))
                }
            } catch (ge) {
                L = !0,
                U = ge
            } finally {
                try {
                    T && null != q.return && (yield q.return())
                } finally {
                    if (L)
                        throw U
                }
            }
            return e.disableTexts || (yield n._storeTextData(!0)),
            r.rootNode.addChild(l),
            0 == --n._modelOpCount && (e.quietMode || r.setOverlayState(!1),
            r.zoomToVisible()),
            l
        })()
    }
    _storeMesh(i, e, n, r, o, s) {
        var a = this;
        return y(function*() {
            if (null == s) {
                let tn = function(dn, Fn, Gn, Jn, ur) {
                    Gn = Gn || [1, 0, 0],
                    C[w / 4 + 0] = dn[0],
                    C[w / 4 + 1] = dn[1],
                    C[w / 4 + 2] = dn[2],
                    m[w + 12] = 127 * Gn[0],
                    m[w + 13] = 127 * Gn[1],
                    m[w + 14] = 127 * Gn[2],
                    m[w + 18] = YV(Fn),
                    m[w + 19] = qV(Fn),
                    m[w + 20] = Jn,
                    m[w + 24] = 0,
                    m[w + 25] = ur[0],
                    m[w + 26] = 0,
                    m[w + 27] = 1 - ur[1],
                    w += 28
                }
                  , fn = function(dn, Fn, Gn) {
                    Gn = Gn || [1, 0, 0],
                    l[d / 4 + 0] = dn[0],
                    l[d / 4 + 1] = dn[1],
                    l[d / 4 + 2] = dn[2],
                    c[d + 12] = 127 * Gn[0],
                    c[d + 13] = 127 * Gn[1],
                    c[d + 14] = 127 * Gn[2],
                    c[d + 18] = YV(Fn),
                    c[d + 19] = qV(Fn),
                    d += 20
                }
                  , Bt = function(dn) {
                    T[L / 4 + 0] = dn[0],
                    T[L / 4 + 1] = dn[1],
                    T[L / 4 + 2] = dn[2],
                    L += 16
                }
                  , xe = function(dn, Fn, Gn) {
                    var Jn = [Fn[0] - dn[0], Fn[1] - dn[1], Fn[2] - dn[2]]
                      , ur = [Gn[0] - dn[0], Gn[1] - dn[1], Gn[2] - dn[2]];
                    return (t => {
                        const i = (t => Math.sqrt(t[0] ** 2 + t[1] ** 2 + t[2] ** 2))(t);
                        return 0 == i ? [1, 0, 0] : ( (t, i) => [t[0] * i, t[1] * i, t[2] * i])(t, 1 / i)
                    }
                    )([Jn[1] * ur[2] - Jn[2] * ur[1], Jn[2] * ur[0] - Jn[0] * ur[2], Jn[0] * ur[1] - Jn[1] * ur[0]])
                }
                  , Se = function(dn, Fn, Gn) {
                    if (i.vertexbuffer.bNormals)
                        fn(dn[0], Gn, Fn[0]),
                        fn(dn[1], Gn, Fn[1]),
                        fn(dn[2], Gn, Fn[2]);
                    else {
                        const Jn = xe(dn[0], dn[1], dn[2]);
                        fn(dn[0], Gn, Jn),
                        fn(dn[1], Gn, Jn),
                        fn(dn[2], Gn, Jn)
                    }
                }
                  , pt = function(dn, Fn, Gn, Jn, ur) {
                    if (i.vertexbuffer.bNormals)
                        tn(dn[0], Gn, Fn[0], Jn, ur[0]),
                        tn(dn[1], Gn, Fn[1], Jn, ur[1]),
                        tn(dn[2], Gn, Fn[2], Jn, ur[2]);
                    else {
                        const Ha = xe(dn[0], dn[1], dn[2]);
                        tn(dn[0], Gn, Ha, Jn, ur[0]),
                        tn(dn[1], Gn, Ha, Jn, ur[1]),
                        tn(dn[2], Gn, Ha, Jn, ur[2])
                    }
                }
                  , hn = function(dn) {
                    Qt % 2 != 0 || In[0] == dn[0] && In[1] == dn[1] && In[2] == dn[2] ? In = dn : (Bt([1 / 0, 1 / 0, 1 / 0]),
                    In = [1 / 0, 1 / 0, 1 / 0])
                };
                const Ne = ck._countMeshVertices(i);
                var c = new Uint8Array(20 * Ne.triangle)
                  , l = new Float32Array(c.buffer)
                  , d = 0
                  , m = new Uint8Array(28 * Ne.triangleTextured)
                  , C = new Float32Array(m.buffer)
                  , w = 0
                  , _ = new Uint8Array(16 * Ne.line)
                  , T = new Float32Array(_.buffer)
                  , L = 0
                  , U = 0
                  , q = 3;
                i.vertexbuffer.bPoints && (U += 3),
                i.vertexbuffer.bNormals && (U += 3,
                q += 3),
                i.vertexbuffer.bTexCoords && (U += 2);
                for (var se = 0; se < i.faceElements.length; se++) {
                    var ge, nt = (ue = i.faceElements[se]).material.bColorValid ? ue.material.oColor : e, Xe = ue.material.nTextureId;
                    const dn = nt.join();
                    a._matMap.has(dn) ? ge = a._matMap.get(dn) : (ge = a._renderer.createMaterials([{
                        diffuse: nt
                    }])[0],
                    a._matMap.set(dn, ge));
                    for (var Fe = [[], [], []], Ft = [[], [], []], Nt = [[], [], []], Qt = 0; Qt < ue.elements.length; Qt++) {
                        var an = ue.elements.vArray[Qt];
                        i.vertexbuffer.bPoints && (Fe[Qt % 3][0] = i.vertexbuffer.vArray[U * an + 0],
                        Fe[Qt % 3][1] = i.vertexbuffer.vArray[U * an + 1],
                        Fe[Qt % 3][2] = i.vertexbuffer.vArray[U * an + 2]),
                        i.vertexbuffer.bNormals && (Ft[Qt % 3][0] = i.vertexbuffer.vArray[U * an + 3],
                        Ft[Qt % 3][1] = i.vertexbuffer.vArray[U * an + 4],
                        Ft[Qt % 3][2] = i.vertexbuffer.vArray[U * an + 5]),
                        i.vertexbuffer.bTexCoords && (Nt[Qt % 3][0] = i.vertexbuffer.vArray[U * an + q],
                        Nt[Qt % 3][1] = i.vertexbuffer.vArray[U * an + q + 1]),
                        Qt % 3 == 2 && (i.vertexbuffer.bTexCoords && -1 != Xe ? pt(Fe, Ft, ge, r[Xe], Nt) : Se(Fe, Ft, ge))
                    }
                }
                var In = [-1 / 0, -1 / 0, -1 / 0];
                for (se = 0; se < i.edgeElements.length; se++) {
                    var ue = i.edgeElements[se];
                    for (Qt = 0; Qt < ue.elements.length; Qt++) {
                        var je = [i.vertexbuffer.vArray[U * (an = ue.elements.vArray[Qt]) + 0], i.vertexbuffer.vArray[U * an + 1], i.vertexbuffer.vArray[U * an + 2]];
                        hn(je),
                        Bt(je)
                    }
                }
                L > 0 && hn([1 / 0, 1 / 0, 1 / 0])
            }
            var lt = a._renderer.createNode();
            for (null != n && (lt.matrix = n),
            s ? lt.linkGeometryData(s) : (c = new Uint8Array(c.buffer,0,d),
            _ = new Uint8Array(_.buffer,0,L),
            m = new Uint8Array(m.buffer,0,w),
            lt.assignGeometryData([c, _, m], Ne => Ne, Ne => Ne)),
            Qt = 0; Qt < o.length; Qt++) {
                var We = o[Qt].oTransform;
                We[12] += o[Qt].vecTextJust[0],
                We[13] += o[Qt].vecTextJust[1],
                We[14] += o[Qt].vecTextJust[2];
                var Qe = [.75 * o[Qt].fHeight, 0, 0, 0, 0, .75 * o[Qt].fHeight, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
                yield a._pushTextData(We, Qe, o[Qt].strText, lt)
            }
            return lt
        })()
    }
    static _countMeshVertices(i) {
        var e = i.edgeElements.reduce( (o, s) => o + 3 * s.elements.length, 0);
        const n = i.faceElements.reduce( (o, s) => o + s.elements.length * (-1 != s.material.nTextureId ? 1 : 0), 0);
        return {
            triangle: i.faceElements.reduce( (o, s) => o + s.elements.length, 0) - n,
            line: e,
            triangleTextured: n
        }
    }
    static _renderText(i, e) {
        const r = [1, 32 * e]
          , o = 16 * e;
        var s = document.createElement("canvas");
        s.width = r[0],
        s.height = r[1];
        var a = s.getContext("2d");
        if (!a)
            throw "Error creating CanvasRenderingContext2D!";
        const c = 20 * e;
        a.font = c + "pt Segoe UI";
        var l = {
            x: o,
            y: r[1] / 2 + c / 2
        }
          , d = a.measureText(i);
        return r[0] = Math.ceil(2 * o + d.actualBoundingBoxRight),
        s.width = r[0],
        a.font = c + "pt Segoe UI",
        a.fillStyle = "#003FFF",
        a.fillText(i, l.x, l.y),
        s
    }
    _storeTextData(i) {
        var e = this;
        return y(function*() {
            if (0 != e._textData.length && (i || 8 == e._textData.length)) {
                null == e._textMaterial && (e._textMaterial = e._renderer.createMaterials([{
                    diffuse: [1, 1, 1, 1]
                }]));
                var r = document.createElement("canvas");
                r.width = r.height = 256;
                var o = r.getContext("2d");
                if (!o)
                    throw "Error creating CanvasRenderingContext2D!";
                for (var s = 0; s < e._textData.length; s++) {
                    var a = ck._renderText(e._textData[s].text, 1 * r.width / 256);
                    a.width > r.width ? o.drawImage(a, 0, s * (r.height / 8), r.width, r.height / 8) : o.drawImage(a, 0, s * (r.height / 8)),
                    e._textData[s].innerMatrix[0] *= a.width / a.height,
                    e._textData[s].relWidth = a.width / r.width
                }
                var c = yield e._renderer.createTextures([[r, null]]);
                if (0 != c.length)
                    for (s = 0; s < e._textData.length; s++) {
                        for (var l = e._renderer.createTexturedPlaneGeometryData(), d = 0; d < l[2].length; d += 28) {
                            var m = 256 * l[2][d + 25] + l[2][d + 24];
                            m *= Math.min(1, e._textData[s].relWidth),
                            l[2][d + 24] = YV(m),
                            l[2][d + 25] = qV(m);
                            var C = 256 * l[2][d + 27] + l[2][d + 26];
                            l[2][d + 26] = YV(C = C / 8 + 256 * (7 - s) / 8),
                            l[2][d + 27] = qV(C)
                        }
                        var w = e._renderer.createNode();
                        w.matrix = e._textData[s].matrix;
                        var _ = e._renderer.createNode();
                        _.assignGeometryData(l, e._textMaterial, c),
                        _.matrix = e._textData[s].innerMatrix,
                        w.addChild(_),
                        e._textData[s].node.addChild(w)
                    }
                else
                    console.warn("Unable to allocate texture for text labels!");
                e._textData = []
            }
        })()
    }
    _pushTextData(i, e, n, r) {
        var o = this;
        return y(function*() {
            o._textData.push({
                matrix: i,
                innerMatrix: e,
                text: n,
                node: r
            }),
            yield o._storeTextData()
        })()
    }
}

async function processE3DFile(url, token) {
    try {
        console.log(`Procesando archivo desde: ${url}`);
        const bvt = new Bvt(url, token);
        console.log("Instancia de Bvt creada");
        
        const sceneData = await bvt.loadSceneData();
        console.log("Datos de la escena cargados:");
        console.log(`Versión del formato E3D: ${sceneData.formatVersion}`);
        console.log(`Número de mallas: ${sceneData.meshes.length}`);
        console.log(`Número de partes: ${sceneData.parts.length}`);
        
        if (sceneData.meshes.length > 0) {
            const firstMesh = sceneData.meshes[0];
            console.log('Primera malla:');
            console.log(`Vértices: ${firstMesh.vertexbuffer.vArray.length / (
                (firstMesh.vertexbuffer.bPoints ? 3 : 0) + 
                (firstMesh.vertexbuffer.bNormals ? 3 : 0) + 
                (firstMesh.vertexbuffer.bTexCoords ? 2 : 0)
            )}`);
        }
        
        if (sceneData.parts.length > 0) {
            const firstPart = sceneData.parts[0];
            console.log('Primera parte:');
            console.log(`ID de malla: ${firstPart.nMeshId}`);
            console.log(`Transformación: ${JSON.stringify(firstPart.oTransform)}`);
        }
    } catch (error) {
        console.error('Error al procesar el archivo E3D:', error);
    }
}

// Uso del script
const url = "https://dataportal.eplan.com/api/download/e3d_data/65921851";
const token = "D2FE459";
processE3DFile(url, token);
