import React, { useCallback, useEffect, useRef } from 'react';
import { DragDropContext, DragDropContextProps, BeforeCapture, DropResult, ResponderProvided } from '@hello-pangea/dnd';
import { useUIScale } from '../../context/UIScaleContext';

/**
 * DragDropContext ciente do zoom da interface (`--ui-scale`).
 *
 * PROBLEMA: com `zoom` na raiz existem dois espacos de coordenadas.
 *   - `getBoundingClientRect()` e `event.clientX` vem em px FISICOS (da janela);
 *   - `style.top/left/transform` sao interpretados em px LOCAIS (ja escalados).
 * O @hello-pangea/dnd mede em fisico e escreve em local, entao o card arrastado
 * aparece deslocado e "atrasado" em relacao ao cursor quando a escala != 100%.
 *
 * SOLUCAO: enquanto um arraste esta ativo, converter as leituras de geometria
 * para o espaco LOCAL (dividindo pela escala). Assim a lib mede e escreve na
 * mesma unidade. O patch:
 *   - so existe entre onBeforeCapture e onDragEnd (janela curta, so o dnd le geometria ai);
 *   - e no-op quando a escala e 100% (monitor grande / preferencia 100%);
 *   - e sempre desfeito, inclusive no unmount.
 */

interface ScaleShim {
    restore: () => void;
}

function installScaleShim(scale: number): ScaleShim {
    const toLocal = (value: number) => value / scale;

    const originalGetRect = Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect = function scaledGetBoundingClientRect(this: Element) {
        const r = originalGetRect.call(this);
        const top = toLocal(r.top);
        const left = toLocal(r.left);
        const width = toLocal(r.width);
        const height = toLocal(r.height);
        return {
            x: left,
            y: top,
            top,
            left,
            width,
            height,
            right: left + width,
            bottom: top + height,
            toJSON() {
                return { x: left, y: top, top, left, width, height, right: left + width, bottom: top + height };
            },
        } as DOMRect;
    };

    // Coordenadas de ponteiro: clientX/clientY vem em px fisicos.
    const patchedCoords: { target: object; prop: string; original: PropertyDescriptor }[] = [];
    const patchCoord = (proto: object | undefined, prop: 'clientX' | 'clientY') => {
        if (!proto) return;
        const original = Object.getOwnPropertyDescriptor(proto, prop);
        if (!original?.get) return;
        const getter = original.get;
        Object.defineProperty(proto, prop, {
            configurable: true,
            enumerable: original.enumerable,
            get(this: unknown) {
                return toLocal(getter.call(this) as number);
            },
        });
        patchedCoords.push({ target: proto, prop, original });
    };

    patchCoord(MouseEvent.prototype, 'clientX');
    patchCoord(MouseEvent.prototype, 'clientY');
    if (typeof Touch !== 'undefined') {
        patchCoord(Touch.prototype, 'clientX');
        patchCoord(Touch.prototype, 'clientY');
    }

    // Viewport usado pelo auto-scroll do dnd.
    // Em Chrome, `innerWidth` e propriedade PROPRIA de window — um `delete` na
    // restauracao apagaria a original de vez (e o modo automatico depende dela).
    // Por isso guardamos o descritor e o reinstalamos.
    const patchedViewport: { prop: 'innerWidth' | 'innerHeight'; original?: PropertyDescriptor }[] = [];
    (['innerWidth', 'innerHeight'] as const).forEach((prop) => {
        const original = Object.getOwnPropertyDescriptor(window, prop);
        const physical = window[prop];
        Object.defineProperty(window, prop, { configurable: true, get: () => toLocal(physical) });
        patchedViewport.push({ prop, original });
    });

    return {
        restore() {
            Element.prototype.getBoundingClientRect = originalGetRect;
            patchedCoords.forEach(({ target, prop, original }) => {
                Object.defineProperty(target, prop, original);
            });
            patchedViewport.forEach(({ prop, original }) => {
                if (original) {
                    Object.defineProperty(window, prop, original);
                } else {
                    delete (window as unknown as Record<string, unknown>)[prop];
                }
            });
        },
    };
}

export const ScaledDragDropContext: React.FC<DragDropContextProps> = ({
    children,
    onBeforeCapture,
    onDragEnd,
    ...rest
}) => {
    const { scale } = useUIScale();
    const shimRef = useRef<ScaleShim | null>(null);

    const clearShim = useCallback(() => {
        shimRef.current?.restore();
        shimRef.current = null;
    }, []);

    // Garante que o patch nunca sobreviva ao componente.
    useEffect(() => clearShim, [clearShim]);

    const handleBeforeCapture = useCallback(
        (before: BeforeCapture) => {
            clearShim();
            if (scale !== 1) {
                shimRef.current = installScaleShim(scale);
            }
            onBeforeCapture?.(before);
        },
        [clearShim, scale, onBeforeCapture]
    );

    const handleDragEnd = useCallback(
        (result: DropResult, provided: ResponderProvided) => {
            clearShim();
            onDragEnd(result, provided);
        },
        [clearShim, onDragEnd]
    );

    return (
        <DragDropContext {...rest} onBeforeCapture={handleBeforeCapture} onDragEnd={handleDragEnd}>
            {children}
        </DragDropContext>
    );
};
