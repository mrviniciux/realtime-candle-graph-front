'use client';

import { ApexOptions } from 'apexcharts';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface CandleData {
  x: Date;
  y: [number, number, number, number]; // [open, high, low, close]
}

export default function Home() {
  const [seriesData, setSeriesData] = useState<CandleData[]>([]);

  const options: ApexOptions = {
    chart: {
      type: 'candlestick',
      height: 350,
    },
    title: {
      text: 'CandleStick Chart',
      align: 'left',
    },
    xaxis: {
      type: 'datetime',
    },
    yaxis: {
      tooltip: {
        enabled: true,
      },
    },
  };

  useEffect(() => {
    const wsUrl = 'wss://fstream.binance.com/ws/btcusdt@markPrice';
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('Conectado ao WebSocket da Binance');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const price = parseFloat(data.p); // Mark price
      const timestamp = new Date(data.E);
      const periodStart = Math.floor(timestamp.getTime() / 5000) * 5000;
      const periodStartDate = new Date(periodStart);

      setSeriesData((prevData) => {
        const lastCandle = prevData[prevData.length - 1];

        if (
          !lastCandle ||
          lastCandle.x.getTime() !== periodStartDate.getTime()
        ) {
          const newCandle: CandleData = {
            x: periodStartDate,
            y: [price, price, price, price],
          };
          return [...prevData, newCandle];
        } else {
          const updatedCandle: CandleData = {
            ...lastCandle,
            y: [
              lastCandle.y[0],
              Math.max(lastCandle.y[1], price), // high
              Math.min(lastCandle.y[2], price), // low
              price,
            ],
          };
          return [...prevData.slice(0, -1), updatedCandle];
        }
      });
    };

    ws.onerror = () => {
      console.log('Erro no WebSocket:');
    };

    ws.onclose = () => {
      console.log('Conexão WebSocket fechada');
    };

    return () => {
      ws.close();
    };
  }, []);

  return (
    <>
      <Chart
        type="candlestick"
        options={options}
        series={[{ data: seriesData }]}
        width={500}
        height={320}
      />
    </>
  );
}
