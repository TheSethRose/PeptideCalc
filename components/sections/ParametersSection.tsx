import React from 'react';
import { Calendar, Percent, Truck } from 'lucide-react';
import { inputStyles } from '../ui';

interface ParametersSectionProps {
  startDate: string;
  setStartDate: (val: string) => void;
  startWeek: number;
  setStartWeek: (val: number) => void;
  discountPercent: number;
  setDiscountPercent: (val: number) => void;
  reorderLeadWeeks: number;
  setReorderLeadWeeks: (val: number) => void;
}

export const ParametersSection: React.FC<ParametersSectionProps> = ({
  startDate,
  setStartDate,
  startWeek,
  setStartWeek,
  discountPercent,
  setDiscountPercent,
  reorderLeadWeeks,
  setReorderLeadWeeks,
}) => (
  <section>
    <div className="flex items-center gap-2 mb-3">
      <Calendar className="w-4 h-4" style={{ color: 'var(--primary)' }} />
      <h3 className="text-sm font-bold" style={{ color: 'var(--card-foreground)' }}>
        Parameters
      </h3>
    </div>

    <div className="grid grid-cols-2 gap-3 mb-3">
      <div>
        <label style={inputStyles.label}>Start Date</label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          style={inputStyles.base}
        />
      </div>
      <div>
        <label style={inputStyles.label}>Current Week</label>
        <input
          type="number"
          min="1"
          value={startWeek}
          onChange={(e) => setStartWeek(parseInt(e.target.value) || 1)}
          style={inputStyles.base}
        />
      </div>
    </div>

    <div className="grid grid-cols-2 gap-3">
      <div>
        <label style={inputStyles.label}>Discount %</label>
        <div className="relative">
          <input
            type="number"
            min="0"
            max="100"
            value={discountPercent}
            onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)}
            style={{ ...inputStyles.base, paddingLeft: '2rem' }}
            placeholder="0"
          />
          <Percent
            className="absolute w-4 h-4"
            style={{ left: '0.625rem', top: '0.625rem', color: 'var(--muted-foreground)' }}
          />
        </div>
      </div>
      <div>
        <label style={inputStyles.label}>Lead Time (Wks)</label>
        <div className="relative">
          <input
            type="number"
            min="1"
            max="12"
            value={reorderLeadWeeks}
            onChange={(e) => setReorderLeadWeeks(parseInt(e.target.value) || 1)}
            style={{ ...inputStyles.base, paddingLeft: '2rem' }}
            placeholder="2"
          />
          <Truck
            className="absolute w-4 h-4"
            style={{ left: '0.625rem', top: '0.625rem', color: 'var(--muted-foreground)' }}
          />
        </div>
        <p className="text-[9px] mt-1" style={{ color: 'var(--muted-foreground)' }}>
          Warns when stock &lt; need.
        </p>
      </div>
    </div>
  </section>
);
