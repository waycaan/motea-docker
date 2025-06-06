import UIState from 'libs/web/state/ui';
import { ReactNode, useState, useEffect } from 'react';
import { use100vh } from 'react-div-100vh';

interface ItemProps {
    selected: boolean;
}

interface Props<T> {
    ItemComponent: (item: T, props: ItemProps) => ReactNode;
    items: T[];
    onEnter?: (item: T) => void;
}

export default function FilterModalList<T>({
    ItemComponent,
    items,
    onEnter,
}: Props<T>) {
    const {
        ua: { isMobileOnly },
    } = UIState.useContainer();
    const height = use100vh() || 0;
    const calcHeight = isMobileOnly ? height : (height * 2) / 3;
    const [selectedIndex, setSelectedIndex] = useState(0);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            const target = event.target as HTMLElement;
            const isInputElement = target.tagName === 'INPUT';

            if (!isInputElement) return;

            switch (event.key) {
                case 'ArrowDown':
                    event.preventDefault();
                    setSelectedIndex((prev) => Math.min((items?.length ?? 0) - 1, prev + 1));
                    break;
                case 'ArrowUp':
                    event.preventDefault();
                    setSelectedIndex((prev) => Math.max(0, prev - 1));
                    break;
                case 'Enter':
                    event.preventDefault();
                    if (items && items[selectedIndex]) {
                        onEnter?.(items[selectedIndex]);
                    }
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [items, selectedIndex, onEnter]);

    return (
        <>
            {items?.length ? (
                <ul className="list border-t border-gray-100 overflow-auto divide-y divide-gray-100">
                    {items?.map((item, index) =>
                        ItemComponent(item, {
                            selected: selectedIndex === index,
                        })
                    )}
                </ul>
            ) : null}
            <style jsx>{`
                .list {
                    max-height: calc(
                        ${calcHeight ? calcHeight + 'px' : '100vh'} - 40px
                    );
                }
            `}</style>
        </>
    );
}
