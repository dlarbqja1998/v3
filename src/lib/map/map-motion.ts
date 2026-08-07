type StoppableMap = {
	stop?: () => void;
};

export function cancelMapMotion(map: StoppableMap | null) {
	map?.stop?.();
}
