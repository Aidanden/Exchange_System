import { useState } from 'react';
import axios from 'axios';
import NationalityList from './NationalityList';
import { Button, TextField, CircularProgress } from '@mui/material';

const SearchPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [nationalits, setNationalits] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery) return;

    setLoading(true);

    try {
      const response = await axios.get('http://localhost:8000/api/search-nationalit', {
        params: { searchQuery },
      });
      setNationalits(response.data);
    } catch (error) {
      console.error('Error fetching nationalities:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-center mb-6">بحث عن الجنسيات</h1>

      <div className="flex justify-center mb-6">
        <TextField
          label="اسم الجنسية"
          variant="outlined"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="mr-4"
        />
        <Button
          variant="contained"
          color="primary"
          onClick={handleSearch}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'ابحث'}
        </Button>
      </div>

      {/*<NationalityList nationalits={nationalits} />*/}
    </div>
  );
};

export default SearchPage;
