import React, {useEffect, useState} from 'react';
import {Box, render, Text, useInput} from 'ink';
import wifiPkg from 'node-wifi';
import Spinner from 'ink-spinner';
import SelectInput from 'ink-select-input';
import TextInput from 'ink-text-input';

type Wifi = {
	name: string;
	quality: number;
	security: string;
};

const HeaderComponent = () => {
	return (
		<Box borderStyle="classic">
			<Box marginLeft={2} width={30}>
				<Text>Name</Text>
			</Box>
			<Box width={15}>
				<Text>Power</Text>
			</Box>
			<Box>
				<Text>Security</Text>
			</Box>
		</Box>
	);
};

const BodyComponent = ({
	wifiList,
	handleSelect,
}: {
	wifiList: Wifi[];
	handleSelect: (item: {value: string}) => void;
}) => {
	const selectItem = (wifi: Wifi) => ({
		label: `${wifi.name},${wifi.quality},${wifi.security}`,
		value: wifi.name,
	});

	return (
		<Box borderStyle="classic">
			<SelectInput
				onSelect={handleSelect}
				items={wifiList.map(wifi => selectItem(wifi))}
				itemComponent={({isSelected, label}) => {
					const [name, power, security] = label.split(',');
					const selectedColor = isSelected ? 'blueBright' : 'white';

					return (
						<>
							<Box width={30}>
								<Text color={selectedColor}>{name}</Text>
							</Box>
							<Box width={15}>
								<Text color={selectedColor}>{power}</Text>
							</Box>
							<Box>
								<Text color={selectedColor}>{security}</Text>
							</Box>
						</>
					);
				}}
			/>
		</Box>
	);
};

const App = () => {
	const [wifiList, setWifiData] = useState<Wifi[]>([]);
	const [wifiSelected, setWifiSelected] = useState<string>('');
	const [wifiPassword, setWifiPassword] = useState<string>('');
	const [isWifiConnected, setIsWifiConnected] = useState<boolean>(false);
	const [isWifiConnectedError, setIsWifiConnectedError] =
		useState<boolean>(false);

	wifiPkg.init({
		iface: null, // network interface, choose a random wifi interface if set to null
	});

	useEffect(() => {
		getWifiList();

		const timer = setInterval(() => {
			getWifiList();
		}, 3000);

		return () => {
			clearInterval(timer);
		};
	}, []);

	useInput(input => {
		if (input.toLowerCase() === 'q' && !wifiSelected) {
			process.exit();
		}
	});

	const getWifiList = () => {
		wifiPkg.scan((error, networks) => {
			if (error) {
				console.log(error);
			} else {
				setWifiData(
					networks
						.filter(network => network.ssid)
						.map(network => ({
							name: network.ssid,
							quality: network.quality,
							security: network.security,
						})),
				);
			}
		});
	};

	const handleSelect = (item: {value: string}) => {
		setWifiSelected(item.value);
	};

	const wifiConnect = async () => {
		try {
			await wifiPkg.connect({ssid: wifiSelected, password: wifiPassword});
			setIsWifiConnected(true);
		} catch {
			setWifiSelected('');
			setWifiPassword('');
			setIsWifiConnectedError(true);
		}
	};

	return (
		<Box borderStyle="round" borderColor="magenta" flexDirection="column">
			{isWifiConnected && (
				<Text color="green">Connected to {wifiSelected}</Text>
			)}
			{isWifiConnectedError && !wifiSelected && (
				<Text color="red">Error connecting to {wifiSelected}</Text>
			)}

			{!wifiSelected && !isWifiConnected && (
				<>
					{wifiList.length === 0 && (
						<Text color="green">
							<Spinner />
						</Text>
					)}
					{wifiList.length > 0 && (
						<>
							<HeaderComponent />
							<BodyComponent handleSelect={handleSelect} wifiList={wifiList} />
						</>
					)}
				</>
			)}
			{wifiSelected && !isWifiConnected && (
				<Box flexDirection="column">
					<Box>
						<Text>
							Try connect to <Text color="blueBright">{wifiSelected}</Text>
						</Text>
					</Box>
					<Box>
						<Box marginRight={1}>
							<Text>Password:</Text>
						</Box>
						<TextInput
							value={wifiPassword}
							onChange={setWifiPassword}
							onSubmit={wifiConnect}
						/>
					</Box>
				</Box>
			)}
		</Box>
	);
};

render(<App />);
